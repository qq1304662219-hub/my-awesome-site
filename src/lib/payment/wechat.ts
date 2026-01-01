// import WxPay from 'wechatpay-node-v3';

// // Initialize WeChat Pay SDK
// // 微信支付 SDK 初始化
// // 注意：Vercel 等 Serverless 环境建议将证书内容直接存储在环境变量中
// // 证书内容通常包含换行符，在 .env 中可以使用 \n 或者 Base64 编码

// const wxPay = new WxPay({
//   // 直连商户模式
//   appid: process.env.WECHAT_PAY_APP_ID || '',
//   mchid: process.env.WECHAT_PAY_MCH_ID || '',
  
//   // 商户公钥证书 (apiclient_cert.pem 内容)
//   publicKey: process.env.WECHAT_PAY_PUBLIC_CERT || '',
  
//   // 商户私钥 (apiclient_key.pem 内容)
//   privateKey: process.env.WECHAT_PAY_PRIVATE_KEY || '',
  
//   // API v3 密钥
//   key: process.env.WECHAT_PAY_API_V3_KEY || '',
// });

// export default wxPay;

// Temporary stub to fix build until enterprise credentials are available
const wxPay = null;
export default wxPay;
