/**
 * Recovery functionality for stuck auto-gift executions
 */

export async function recoverStuckExecutions(supabaseClient: any) {
  console.log('🔧 Checking for stuck executions...')
  
  try {
    // Find executions that have been in "processing" status for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: stuckExecutions, error } = await supabaseClient
      .from('automated_gift_executions')
      .select('id, user_id, rule_id, status, created_at, updated_at, retry_count')
      .eq('status', 'processing')
      .lt('updated_at', thirtyMinutesAgo)

    if (error) {
      console.error('❌ Error querying stuck executions:', error)
      return
    }

    if (!stuckExecutions || stuckExecutions.length === 0) {
      console.log('✅ No stuck executions found')
      return
    }

    console.log(`🔧 Found ${stuckExecutions.length} stuck execution(s)`)

    for (const execution of stuckExecutions) {
      try {
        await recoverSingleExecution(supabaseClient, execution)
      } catch (error) {
        console.error(`❌ Failed to recover execution ${execution.id}:`, error)
      }
    }

  } catch (error) {
    console.error('❌ Error in stuck execution recovery:', error)
  }
}

async function recoverSingleExecution(supabaseClient: any, execution: any) {
  console.log(`🔧 Recovering stuck execution ${execution.id}`)
  
  const maxRetries = 3
  const shouldRetry = (execution.retry_count || 0) < maxRetries
  
  if (shouldRetry) {
    // Reset to pending for retry with exponential backoff
    const retryDelay = Math.pow(2, execution.retry_count || 0) * 5 // 5, 10, 20 minutes
    const nextRetryAt = new Date(Date.now() + retryDelay * 60 * 1000).toISOString()
    
    console.log(`🔄 Scheduling retry ${(execution.retry_count || 0) + 1}/${maxRetries} for execution ${execution.id}`)
    
    const { error: updateError } = await supabaseClient
      .from('automated_gift_executions')
      .update({
        status: 'pending',
        retry_count: (execution.retry_count || 0) + 1,
        next_retry_at: nextRetryAt,
        error_message: 'Recovered from stuck processing state',
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    if (updateError) {
      console.error(`❌ Failed to update execution ${execution.id}:`, updateError)
    } else {
      console.log(`✅ Execution ${execution.id} scheduled for retry`)
    }
  } else {
    // Mark as failed after max retries
    console.log(`❌ Marking execution ${execution.id} as failed after ${maxRetries} retries`)
    
    const { error: failError } = await supabaseClient
      .from('automated_gift_executions')
      .update({
        status: 'failed',
        error_message: `Processing stuck and exceeded ${maxRetries} retry attempts`,
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    if (failError) {
      console.error(`❌ Failed to mark execution ${execution.id} as failed:`, failError)
    } else {
      console.log(`✅ Execution ${execution.id} marked as failed`)
    }
  }

  // Log the recovery action
  try {
    await supabaseClient
      .from('auto_gift_notifications')
      .insert({
        user_id: execution.user_id,
        execution_id: execution.id,
        notification_type: 'execution_recovery',
        title: 'Auto-Gift Execution Recovered',
        message: shouldRetry 
          ? `Your auto-gift execution was stuck and has been scheduled for retry`
          : `Your auto-gift execution failed after multiple retry attempts`,
        email_sent: false,
        is_read: false
      })
  } catch (notificationError) {
    console.error(`❌ Failed to create recovery notification:`, notificationError)
  }
}