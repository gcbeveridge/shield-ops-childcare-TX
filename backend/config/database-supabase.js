const supabase = require('./supabase');

const supabaseDb = {
  async query(text, params) {
    console.log(`⚠️ Raw query called: ${text.substring(0, 100)}...`);
    console.log('   Consider using Supabase client methods instead');
    throw new Error('Raw queries not supported with Supabase. Use Supabase client methods.');
  },
  
  async get(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`DB get error (${table}):`, error.message);
      return null;
    }
  },
  
  async list(table, filters = {}) {
    try {
      let query = supabase.from(table).select('*');
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`DB list error (${table}):`, error.message);
      return [];
    }
  },
  
  async insert(table, record) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`DB insert error (${table}):`, error.message);
      throw error;
    }
  },
  
  async update(table, id, updates) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`DB update error (${table}):`, error.message);
      throw error;
    }
  },
  
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`DB delete error (${table}):`, error.message);
      throw error;
    }
  },
  
  supabase
};

module.exports = supabaseDb;
