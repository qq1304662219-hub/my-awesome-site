// import AlipaySdk from 'alipay-sdk';

// // Initialize Alipay SDK
// // 支付宝 SDK 初始化
// const alipaySdk = new AlipaySdk({
//   // 应用ID
//   appId: process.env.ALIPAY_APP_ID || '',
  
//   // 应用私钥 (PKCS8 格式)
//   privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  
//   // 支付宝公钥 (注意不是应用公钥)
//   alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  
//   // 网关地址 (根据是否是沙箱环境自动切换)
//   // 如果 ALIPAY_GATEWAY 环境变量存在则使用，否则默认生产环境
//   endpoint: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  
//   // 签名算法
//   signType: 'RSA2',
// });

// export default alipaySdk;

// Temporary stub to fix build until enterprise credentials are available
const alipaySdk = null;
export default alipaySdk;
