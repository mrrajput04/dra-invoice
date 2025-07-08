export const numberToWords = (num) => {
	const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
	const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
	const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

	if (num === 0) return 'Zero';

	const convertHundreds = (n) => {
		let result = '';
		if (n >= 100) {
			result += ones[Math.floor(n / 100)] + ' Hundred ';
			n %= 100;
		}
		if (n >= 20) {
			result += tens[Math.floor(n / 10)] + ' ';
			n %= 10;
		} else if (n >= 10) {
			result += teens[n - 10] + ' ';
			return result;
		}
		if (n > 0) {
			result += ones[n] + ' ';
		}
		return result;
	};

	let word = '';

	// Handle crores (10,000,000)
	if (num >= 10000000) {
		word += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
		num %= 10000000;
	}

	// Handle lakhs (100,000)
	if (num >= 100000) {
		word += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
		num %= 100000;
	}

	// Handle thousands (1,000)
	if (num >= 1000) {
		word += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
		num %= 1000;
	}

	// Handle remaining hundreds, tens, and ones
	if (num > 0) {
		word += convertHundreds(num);
	}

	return word.trim();
};