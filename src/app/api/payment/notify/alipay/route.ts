import { NextResponse } from 'next/server';
import alipaySdk from '@/lib/payment/alipay';
import { createClient } from '@supabase/supabase-js';

// 支付宝异步通知回调接口
export async function POST(request: Request) {
  try {
    // 1. 获取回调参数
    // Next.js App Router 中获取 POST 表单数据
    const formData = await request.formData();
    const params: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('Alipay Notify Params:', params);

    // 2. 验签
    // 支付宝 SDK 提供了 checkNotifySign 方法
    const isValid = alipaySdk.checkNotifySign(params);

    if (!isValid) {
      console.error('Alipay Signature Verification Failed');
      return new NextResponse('fail', { status: 400 });
    }

    // 3. 处理业务逻辑
    // 交易状态: TRADE_SUCCESS 或 TRADE_FINISHED 表示支付成功
    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no; // 我们的订单号 (Transaction ID)
    const tradeNo = params.trade_no; // 支付宝交易号
    const totalAmount = params.total_amount;

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      
      // 初始化 Supabase Admin 客户端
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      // 3.1 检查订单状态，避免重复处理 (幂等性)
      const { data: transaction, error: fetchError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', outTradeNo) // 假设我们用 transaction.id 作为 out_trade_no
        .single();

      if (fetchError || !transaction) {
        console.error('Transaction not found:', outTradeNo);
        // 即使找不到订单，也应该返回 success 给支付宝，避免重复通知 (或者返回 fail 让它重试，视情况而定)
        // 通常如果订单号不存在，可能是系统异常，返回 fail 可能更好
        return new NextResponse('fail');
      }

      if (transaction.status === 'completed') {
        // 已经处理过
        return new NextResponse('success');
      }

      // 3.2 更新用户余额和订单状态
      // 使用 RPC 或者事务更新
      
      // 方式 A: 直接更新 (简单)
      // 更新 Transaction
      const { error: updateTxError } = await supabaseAdmin
        .from('transactions')
        .update({
          status: 'completed',
          description: transaction.description + ` (支付宝交易号: ${tradeNo})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', outTradeNo);

      if (updateTxError) {
        console.error('Failed to update transaction:', updateTxError);
        return new NextResponse('fail');
      }

      // 更新用户余额
      // 注意：这里应该使用原子操作，或者假设 transaction type = 'recharge'
      if (transaction.type === 'recharge' || transaction.type === 'recharge_pending') {
         const { error: balanceError } = await supabaseAdmin.rpc('increment_balance', {
             user_id: transaction.user_id,
             amount: parseFloat(totalAmount)
         });
         
         // 如果没有 RPC，手动更新:
         if (balanceError) {
             // Fallback to manual update
             const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', transaction.user_id).single();
             const newBalance = (profile?.balance || 0) + parseFloat(totalAmount);
             await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', transaction.user_id);
         }
      }

      console.log(`Order ${outTradeNo} processed successfully.`);
    }

    // 4. 返回 success (纯文本)
    return new NextResponse('success');

  } catch (error) {
    console.error('Alipay Notify Error:', error);
    return new NextResponse('fail', { status: 500 });
  }
}
