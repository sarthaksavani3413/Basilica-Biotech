import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================
// JSON SYNC FUNCTION
// ========================
const syncToJson = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.log('❌ JSON SYNC ERROR:', error.message);
            return;
        }

        fs.writeFileSync(
            './data.json',
            JSON.stringify(data, null, 2)
        );

        console.log('✅ JSON UPDATED');

    } catch (err) {
        console.log('❌ SERVER ERROR:', err.message);
    }
};



// ========================
// INSERT PRODUCT
// ========================
export const insertProduct = async (product) => {
    try {

        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) {
            console.log('❌ INSERT ERROR:', error.message);
            return;
        }

        console.log('✅ INSERTED:', data.name);

        await syncToJson();

    } catch (err) {
        console.log('❌ SERVER ERROR:', err.message);
    }
};



// ========================
// UPDATE PRODUCT
// ========================
export const updateProduct = async (id, updatedData) => {
    try {

        const { data, error } = await supabase
            .from('products')
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.log('❌ UPDATE ERROR:', error.message);
            return;
        }

        console.log('✅ UPDATED:', data.name);

        await syncToJson();

    } catch (err) {
        console.log('❌ SERVER ERROR:', err.message);
    }
};



// ========================
// DELETE PRODUCT
// ========================
export const deleteProduct = async (id) => {
    try {

        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.log('❌ DELETE ERROR:', error.message);
            return;
        }

        console.log('🗑️ DELETED:', id);

        await syncToJson();

    } catch (err) {
        console.log('❌ SERVER ERROR:', err.message);
    }
};



// ========================
// GET PRODUCTS
// ========================
export const getProducts = async () => {
    try {

        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.log('❌ FETCH ERROR:', error.message);
            return [];
        }

        return data;

    } catch (err) {
        console.log('❌ SERVER ERROR:', err.message);
        return [];
    }
};