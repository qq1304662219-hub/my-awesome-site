import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with DeepSeek configuration
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder', // Fallback to avoid initialization error if key is missing
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const msg = message.toLowerCase();

    // 1. Check if DeepSeek API Key is configured
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `你是一个名为“光子”的AI智能客服助手，服务于一家专业的视频素材交易平台。
              
              你的主要职责是：
              1. 热情、礼貌地回答用户关于平台使用、会员充值、视频上传下载、发票申请等问题。
              2. 你的回答应该简洁明了，语气专业且亲切。
              3. 如果用户询问你无法回答的技术问题或账号具体状态，请建议他们联系人工客服。
              4. 平台支持支付宝和微信支付。
              5. 视频格式支持 MP4, MOV 等主流格式。
              6. 只有购买会员或单独购买素材后才能下载无水印视频。
              7. 发票可以在“个人中心” -> “发票管理”中申请，3-5个工作日开具。
              
              如果用户问候你，请用“您好！我是光子，有什么可以帮您的吗？”作为开头。
              `
            },
            { role: "user", content: message }
          ],
          model: "deepseek-chat",
        });

        const aiResponse = completion.choices[0].message.content;
        return NextResponse.json({ response: aiResponse });

      } catch (apiError) {
        console.error('DeepSeek API Error:', apiError);
        // Fallback to local logic if API fails
      }
    }

    // 2. Fallback: Local keyword matching logic (Mock AI)
    // Simulation of AI processing delay only if we fell back
    await new Promise(resolve => setTimeout(resolve, 1000));

    let responseText = "抱歉，我不理解您的问题。您可以尝试咨询人工客服。";

    if (msg.includes('充值') || msg.includes('价格') || msg.includes('套餐') || msg.includes('会员')) {
        responseText = "我们提供多种套餐供您选择。您可以点击右上角的头像，选择“会员中心”查看详细价格和权益。目前支持支付宝和微信支付。";
    } else if (msg.includes('上传') || msg.includes('失败')) {
        responseText = "如果您遇到上传失败的问题，请检查您的网络连接或文件格式。我们支持 MP4, MOV 等主流视频格式。如果问题持续，请尝试刷新页面或联系人工客服。";
    } else if (msg.includes('下载') || msg.includes('水印')) {
        responseText = "购买会员后，您可以下载无水印的高清视频素材。在视频详情页点击“下载”按钮即可。";
    } else if (msg.includes('发票')) {
        responseText = "我们需要您提供开票信息。请在“个人中心” -> “发票管理”中提交申请，我们将在 3-5 个工作日内为您开具电子发票。";
    } else if (msg.includes('账号') || msg.includes('登录')) {
        responseText = "如遇账号登录问题，请检查您的手机号或邮箱输入是否正确。如果是忘记密码，请点击登录框下方的“忘记密码”进行找回。";
    } else if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
        responseText = "您好！我是光子，有什么可以帮您的吗？";
    } else if (msg.includes('人工')) {
        responseText = "正在为您转接人工客服，请稍候...";
    } else if (msg.includes('操作员') || msg.includes('子账号')) {
        responseText = "操作员（子账号）功能允许企业账户分配多个子账号进行协作。您可以在企业管理后台进行设置。";
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
