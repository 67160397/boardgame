import axios from 'axios';

/**
 * ดึงข้อมูลอัตราแลกเปลี่ยน พร้อมกลไก Retry, Timeout และ Fallback
 */
export async function getExchangeRate(retries = 2, delayMs = 1000) {
  // API ภายนอกสำหรับดึงอัตราแลกเปลี่ยน
  const targetUrl = 'https://open.er-api.com/v6/latest/USD';
  const timeoutMs = 2000; // 2. Timeout: กำหนดเวลาสูงสุด 2 วินาที

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`[External API] Calling exchange rate API (Attempt ${attempt}/${retries + 1})...`);

      const response = await axios.get(targetUrl, { timeout: timeoutMs });

      if (response.data && response.data.rates) {
        console.log('[External API] Fetch successful!');
        return {
          success: true,
          source: 'external_api',
          rates: response.data.rates,
          thb_rate: response.data.rates.THB
        };
      }
    } catch (error) {
      console.warn(`[External API] Attempt ${attempt} failed: ${error.message}`);

      // 1. Retry Logic: ถ้ายังไม่ครบจำนวนรอบ ให้รอ delay แล้วลองใหม่
      if (attempt <= retries) {
        console.log(`[External API] Waiting ${delayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // 3. Fallback: หากเรียก API ล้มเหลวครบทุกครั้ง จะใช้ค่า Default คืนกลับไปแทนเพื่อไม่ให้ระบบ crash
  console.error('[External API] All attempts failed. Activating Fallback mechanism.');
  return {
    success: false,
    source: 'fallback',
    message: 'Unable to fetch real-time rate. Using fallback default rate.',
    rates: { THB: 35.5, USD: 1.0 },
    thb_rate: 35.5
  };
}