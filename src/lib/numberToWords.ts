
// Basic number to words converter (supports up to a certain limit, e.g., millions or billions)
// This is a simplified version. For more robust internationalization or larger numbers, a library might be better.

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const thousands = ['', 'Thousand', 'Million', 'Billion']; // Extend as needed

function convertLessThanThousand(num: number): string {
  if (num === 0) {
    return '';
  } else if (num < 10) {
    return ones[num];
  } else if (num < 20) {
    return teens[num - 10];
  } else if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  } else {
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertLessThanThousand(num % 100) : '');
  }
}

export function numberToWords(num: number): string {
  if (num === 0) {
    return 'Zero';
  }
  if (num < 0) {
    return 'Minus ' + numberToWords(Math.abs(num));
  }

  let word = '';
  let i = 0;

  do {
    const n = num % 1000;
    if (n !== 0) {
      word = convertLessThanThousand(n) + (thousands[i] ? ' ' + thousands[i] : '') + (word ? ' ' + word : '');
    }
    num = Math.floor(num / 1000);
    i++;
  } while (num > 0);

  return word.trim();
}
