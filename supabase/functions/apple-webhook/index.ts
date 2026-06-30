import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Função auxiliar para decodificar JWT/JWS sem verificar assinatura (a Apple já assina, mas em prod o ideal é verificar com a chave pública)
function decodeJWS(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // A Apple envia um payload JSON com o campo 'signedPayload'
    const body = await req.json()
    const { signedPayload } = body

    if (!signedPayload) {
      return new Response('No signedPayload found', { status: 400 })
    }

    // 1. Decodificar o payload principal da notificação
    const notification = decodeJWS(signedPayload)
    if (!notification || !notification.data) {
      return new Response('Invalid payload', { status: 400 })
    }

    const { notificationType, data } = notification
    const { signedTransactionInfo } = data

    if (!signedTransactionInfo) {
      return new Response('No transaction info', { status: 200 }) // 200 para a Apple não retentar
    }

    // 2. Decodificar a transação para pegar os detalhes
    const transaction = decodeJWS(signedTransactionInfo)
    if (!transaction) {
      return new Response('Invalid transaction info', { status: 400 })
    }

    const { originalTransactionId, appAccountToken } = transaction

    // 3. Inicializar Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`Recebido Webhook da Apple. Tipo: ${notificationType}, Original_Tx: ${originalTransactionId}, AppAccountToken: ${appAccountToken}`)

    // 4. Regras de Negócio: Tratar cancelamentos e expirações
    const inactiveTypes = ['DID_FAIL_TO_RENEW', 'EXPIRED', 'CANCEL', 'REVOKE']
    
    if (inactiveTypes.includes(notificationType)) {
      // Buscar a assinatura ativa correspondente
      // Nota: 'appAccountToken' (UUID) costuma ser o ID do usuário no Supabase se injetado no app.
      
      let query = supabase.from('subscriptions').update({ status: 'inactive' })
      
      if (appAccountToken) {
        query = query.eq('user_id', appAccountToken)
      } else if (originalTransactionId) {
        // Exige que a tabela tenha uma coluna 'apple_transaction_id'
        query = query.eq('apple_transaction_id', originalTransactionId)
      } else {
        console.error("Faltando identificador para atualizar assinatura.")
        return new Response('No identifier', { status: 200 })
      }

      const { data: updatedSub, error } = await query

      if (error) {
        console.error("Erro ao desativar assinatura no banco:", error)
        throw error
      }
      
      console.log(`Assinatura desativada com sucesso. Motivo: ${notificationType}`)
    } else {
      console.log(`Evento ignorado (não altera status): ${notificationType}`)
    }

    return new Response(JSON.stringify({ message: 'Processado com sucesso' }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })
    
  } catch (error) {
    console.error("Erro no Webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
