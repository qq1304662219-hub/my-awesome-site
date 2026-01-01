import AlipaySdk from 'alipay-sdk';

// Initialize Alipay SDK
// 支付宝 SDK 初始化
const alipaySdk = new AlipaySdk({
  // 应用ID
  appId: process.env.ALIPAY_APP_ID || '',
  
  // 应用私钥 (PKCS8 格式)
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  
  // 支付宝公钥 (注意不是应用公钥)
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  
  // 网关地址 (默认为正式环境)
  endpoint: 'https://openapi.alipay.com/gateway.do',
  
  // 签名算法
  signType: 'RSA2',
});

export default alipaySdk;
