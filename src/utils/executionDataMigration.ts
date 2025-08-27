import { supabase } from '@/integrations/supabase/client';
import { transformProductIdsToObjects } from './productDataTransforms';

/**
 * Updates execution records that have product IDs with complete product objects
 */
export const migrateExecutionProductData = async (executionId: string) => {
  try {
    // Get the current execution
    const { data: execution, error: fetchError } = await supabase
      .from('automated_gift_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (fetchError || !execution) {
      console.error('Error fetching execution:', fetchError);
      return { success: false, error: 'Execution not found' };
    }

    // Check if selected_products needs migration (contains string IDs)
    if (!execution.selected_products || 
        !Array.isArray(execution.selected_products) ||
        execution.selected_products.length === 0 ||
        execution.selected_products[0] === "" ||
        typeof execution.selected_products[0] !== 'string') {
      console.log('Execution already has complete product data or empty products');
      return { success: true, alreadyMigrated: true };
    }

    // Transform product IDs to complete objects
    const productObjects = await transformProductIdsToObjects(
      execution.selected_products,
      supabase
    );

    if (productObjects.length === 0) {
      console.error('Failed to transform product IDs to objects');
      return { success: false, error: 'Failed to fetch product data' };
    }

    // Calculate total amount from products
    const totalAmount = productObjects.reduce((sum, product) => sum + (product.price || 0), 0);

    // Update the execution with complete product data
    const { error: updateError } = await supabase
      .from('automated_gift_executions')
      .update({
        selected_products: productObjects,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (updateError) {
      console.error('Error updating execution:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Successfully migrated execution product data');
    return { 
      success: true, 
      migrated: true,
      productCount: productObjects.length,
      totalAmount
    };

  } catch (error) {
    console.error('Error in migration:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Migrates all executions that need product data updates
 */
export const migrateAllExecutionProductData = async () => {
  try {
    // Get all executions with product data
    const { data: executions, error } = await supabase
      .from('automated_gift_executions')
      .select('id, selected_products')
      .not('selected_products', 'is', null);

    if (error) {
      console.error('Error fetching executions:', error);
      return { success: false, error: error.message };
    }

    const results = [];
    for (const execution of executions) {
      // Check if this execution needs migration
      if (Array.isArray(execution.selected_products) && 
          typeof execution.selected_products[0] === 'string') {
        const result = await migrateExecutionProductData(execution.id);
        results.push({ executionId: execution.id, ...result });
      }
    }

    return { success: true, migrated: results };

  } catch (error) {
    console.error('Error in bulk migration:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};