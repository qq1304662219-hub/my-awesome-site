import { NextResponse } from 'next/server';
import wxPay from '@/lib/payment/wechat';
import { createClient } from '@supabase/supabase-js';

// 微信支付异步通知回调接口
export async function POST(request: Request) {
  try {
    // 1. 获取请求头和请求体
    const headers = {
        'Wechatpay-Signature': request.headers.get('Wechatpay-Signature') || '',
        'Wechatpay-Serial': request.headers.get('Wechatpay-Serial') || '',
        'Wechatpay-Nonce': request.headers.get('Wechatpay-Nonce') || '',
        'Wechatpay-Timestamp': request.headers.get('Wechatpay-Timestamp') || '',
        'Wechatpay-Signature-Type': request.headers.get('Wechatpay-Signature-Type') || '',
    };

    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // 2. 验签并解密
    // verifySign 方法会自动验证签名
    // decipher_gcm 方法用于解密 resource.ciphertext
    
    // 注意: wechatpay-node-v3 的 verifySign 需要完整的 request 对象结构或特定的参数
    // 这里我们手动调用 verify 或者使用 SDK 提供的 verify 方法
    // 假设 SDK 提供了 verify 方法 (具体取决于库的版本，这里用通用逻辑)
    
    const verifyResult = await wxPay.verifySign({
        headers,
        body: body, // 传入解析后的 body 或 raw body 取决于库的实现，通常是 raw body object
    });

    if (!verifyResult) {
        console.error('WeChat Pay Signature Verification Failed');
        return NextResponse.json({ code: 'FAIL', message: '签名验证失败' }, { status: 401 });
    }

    // 3. 解密数据
    const { resource } = body;
    const result = wxPay.decipher_gcm(
        resource.ciphertext,
        resource.associated_data,
        resource.nonce,
        process.env.WECHAT_PAY_API_V3_KEY!
    );

    // result 包含了解密后的订单信息
    // { out_trade_no, transaction_id, trade_state, amount: { total, currency }, ... }
    
    const { out_trade_no, transaction_id, trade_state, amount } = result as any;

    if (trade_state === 'SUCCESS') {
        // 初始化 Supabase Admin 客户端
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 3.1 检查订单状态
        const { data: transaction, error: fetchError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', out_trade_no)
            .single();

        if (fetchError || !transaction) {
            console.error('Transaction not found:', out_trade_no);
            return NextResponse.json({ code: 'FAIL', message: '订单不存在' });
        }

        if (transaction.status === 'completed') {
            return NextResponse.json({ code: 'SUCCESS', message: '成功' });
        }

        // 3.2 更新订单和余额
        const { error: updateTxError } = await supabaseAdmin
            .from('transactions')
            .update({
                status: 'completed',
                description: transaction.description + ` (微信支付单号: ${transaction_id})`,
                updated_at: new Date().toISOString()
            })
            .eq('id', out_trade_no);

        if (updateTxError) {
            console.error('Failed to update transaction:', updateTxError);
            return NextResponse.json({ code: 'FAIL', message: '数据库更新失败' }, { status: 500 });
        }

        // 更新用户余额
        if (transaction.type === 'recharge' || transaction.type === 'recharge_pending') {
             // 微信支付金额单位是 分，需要转换 (假设数据库存的是元)
             const amountInYuan = amount.total / 100;
             
             const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', transaction.user_id).single();
             const newBalance = (profile?.balance || 0) + amountInYuan;
             await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', transaction.user_id);
        }
    }

    // 4. 返回成功响应
    return NextResponse.json({ code: 'SUCCESS', message: '成功' });

  } catch (error) {
    console.error('WeChat Pay Notify Error:', error);
    return NextResponse.json({ code: 'FAIL', message: '内部错误' }, { status: 500 });
  }
}
