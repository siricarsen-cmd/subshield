type BrandNameProps = {
  styled?: boolean;
  className?: string;
};

export default function BrandName({ styled = false, className }: BrandNameProps) {
  if (!styled) {
    return <span className={className}>SubPreCheck</span>;
  }

  return (
    <span className={className} aria-label="SubPreCheck">
      <span aria-hidden="true" className="text-[#FF5F1F]">Sub</span>
      <span aria-hidden="true" className="text-[#1A3668]">Pre</span>
      <span aria-hidden="true" className="text-[#FF5F1F]">Check</span>
    </span>
  );
}
