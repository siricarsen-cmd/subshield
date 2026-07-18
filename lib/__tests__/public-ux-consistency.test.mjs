// Focused, deterministic public UX consistency checks. This test reads local
// source files only and does not call production services.
//
// Run with:
// node lib/__tests__/public-ux-consistency.test.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const readSource = (relativePath) =>
  readFileSync(join(repositoryRoot, relativePath), "utf8");

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

const navbar = readSource("components/Navbar.tsx");
const footer = readSource("components/Footer.tsx");
const faq = readSource("app/faq/page.tsx");
const finalCta = readSource("components/FinalCTA.tsx");
const blogIndex = readSource("app/blog/page.tsx");
const about = readSource("app/about/page.tsx");

check("Navbar exposes the existing FAQ route", navbar.includes('href="/faq"'));
check("Footer exposes the existing FAQ route", footer.includes('href="/faq"'));

const obsoleteFaqClaims = [
  "Proposal-Stage",
  "Award-Stage",
  "within 24 hours",
  "enterprise-grade encryption",
  "strictly private",
  "completely segmented",
  "Attorney Prep Toolkit",
  "START FREE TRIAGE",
];
check(
  "FAQ removes obsolete terminology, guarantees, and intake CTA copy",
  obsoleteFaqClaims.every((claim) => !faq.includes(claim)),
);
check(
  "FAQ contains the nine approved questions",
  (faq.match(/\n\s+q: /g) ?? []).length === 9,
);
check(
  "FAQ final CTA follows the pricing-first funnel",
  finalCta.includes('href="/pricing"') &&
    finalCta.includes("See Plans") &&
    !finalCta.includes('href="/intake"'),
);

const titleLinkPattern =
  /<Link\s+href=\{`\/blog\/\$\{post\.slug\}`\}[\s\S]*?\{post\.title\}[\s\S]*?<\/Link>/;
check("Blog card titles link to their article routes", titleLinkPattern.test(blogIndex));
check(
  "Blog cards keep a separate operational-guide link",
  (blogIndex.match(/href=\{`\/blog\/\$\{post\.slug\}`\}/g) ?? []).length === 2 &&
    blogIndex.includes("Read Operational Guide"),
);
check(
  "Blog index acquisition CTA leads to Pricing",
  blogIndex.includes('href="/pricing"') &&
    blogIndex.includes("See Review Plans") &&
    !blogIndex.includes('href="/login"'),
);

const blogDirectory = join(repositoryRoot, "app/blog");
const articleFiles = readdirSync(blogDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(blogDirectory, entry.name, "page.tsx"))
  .filter((path) => {
    try {
      return statSync(path).isFile();
    } catch {
      return false;
    }
  })
  .sort();

check("All 16 article pages are discovered", articleFiles.length === 16);

for (const articleFile of articleFiles) {
  const article = readFileSync(articleFile, "utf8");
  const articleName = articleFile.slice(repositoryRoot.length + 1);

  check(
    `${articleName} keeps its Knowledge Hub back link`,
    article.includes('href="/blog"') && article.includes("Back to Knowledge Hub"),
  );
  check(
    `${articleName} uses the responsive header-meta row`,
    article.includes("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"),
  );
  check(
    `${articleName} uses a non-solid category badge treatment`,
    article.includes("border-orange-300/60") &&
      article.includes("bg-orange-50") &&
      !article.includes('className="inline-block bg-[#FF5F1F] text-white'),
  );
  check(
    `${articleName} acquisition CTA leads to Pricing only`,
    article.includes('href="/pricing"') &&
      article.includes("See Review Plans") &&
      !/href="\/(?:login|intake)"/.test(article),
  );
  check(
    `${articleName} has no literal SubShield Markdown emphasis`,
    !/\*\*SubShield[^*]*\*\*/.test(article),
  );
}

const founderPath = join(repositoryRoot, "public/founder.jpg");
const founder = readFileSync(founderPath);
check(
  "Founder asset exists, is non-empty, and has a JPEG signature",
  founder.length > 0 && founder[0] === 0xff && founder[1] === 0xd8,
);
check(
  "About page uses the approved founder asset and alt text",
  about.includes('src="/founder.jpg"') &&
    about.includes('alt="Carsen Siri, Founder of SubShield"'),
);

if (failures > 0) process.exit(1);
console.log("\nAll public UX consistency checks passed.");
