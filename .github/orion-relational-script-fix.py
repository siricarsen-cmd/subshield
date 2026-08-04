from pathlib import Path

path = Path('.github/orion-final-relational-patch.py')
text = path.read_text()
old = r'''function namedInvoiceRemainsPayable(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b[^.]{0,100}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  const payableThenInvoice = new RegExp(
    `(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)[^.]{0,100}\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b`,
    "i"
  );
  return invoiceThenPayable.test(sentence) || payableThenInvoice.test(sentence);
}'''
new = r'''function namedInvoiceRemainsPayable(sentence: string, invoiceId: string): boolean {
  const escapedInvoiceId = escapeRegexLiteral(invoiceId);
  const invoiceThenPayable = new RegExp(
    `\\binvoice\\s+(?:no\\.?\\s*)?${escapedInvoiceId}\\b(?:(?!\\binvoice\\s+(?:no\\.?\\s*)?[A-Z0-9-]*\\d[A-Z0-9-]*\\b)[^.]){0,100}(?:remain|remains|shall\\s+remain|will\\s+remain)\\s+(?:payable|due)`,
    "i"
  );
  return invoiceThenPayable.test(sentence);
}'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'payable predicate patch marker: expected one match, found {count}')
path.write_text(text.replace(old, new, 1))
