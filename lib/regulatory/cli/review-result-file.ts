import { mkdir, open, unlink, type FileHandle } from "node:fs/promises";
import path from "node:path";

const RESERVED_RESULT_BYTES = 64 * 1024;
const RESERVATION_HEADER = `${JSON.stringify({
  status: "reserved-before-regulatory-review-decision",
  finalDecisionPersisted: false,
})}\n`;

export interface RegulatoryReviewResultFileReservation {
  filePath: string;
  finalize(serializedResult: string): Promise<void>;
  abandon(): Promise<void>;
}

class ResultFileReservation implements RegulatoryReviewResultFileReservation {
  readonly filePath: string;
  private handle: FileHandle | undefined;
  private finalized = false;

  constructor(filePath: string, handle: FileHandle) {
    this.filePath = filePath;
    this.handle = handle;
  }

  async finalize(serializedResult: string): Promise<void> {
    if (this.finalized || !this.handle) {
      throw new Error("Regulatory review result reservation is already closed");
    }
    const bytes = Buffer.from(serializedResult, "utf8");
    if (bytes.length > RESERVED_RESULT_BYTES) {
      throw new Error("Regulatory review result exceeds the reserved output capacity");
    }
    await this.handle.write(bytes, 0, bytes.length, 0);
    await this.handle.sync();
    await this.handle.truncate(bytes.length);
    await this.handle.sync();
    await this.handle.close();
    this.handle = undefined;
    this.finalized = true;
  }

  async abandon(): Promise<void> {
    if (this.finalized) return;
    if (this.handle) {
      await this.handle.close();
      this.handle = undefined;
    }
    await unlink(this.filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    this.finalized = true;
  }
}

export async function reserveRegulatoryReviewResultFile(
  filePath: string
): Promise<RegulatoryReviewResultFileReservation> {
  const resolved = path.resolve(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  const handle = await open(resolved, "wx+");
  try {
    const reservation = Buffer.alloc(RESERVED_RESULT_BYTES, 0x20);
    reservation.write(RESERVATION_HEADER, 0, "utf8");
    await handle.write(reservation, 0, reservation.length, 0);
    await handle.sync();
    return new ResultFileReservation(resolved, handle);
  } catch (error) {
    await handle.close().catch(() => undefined);
    await unlink(resolved).catch(() => undefined);
    throw error;
  }
}
