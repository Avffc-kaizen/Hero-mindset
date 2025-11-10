
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your Vercel environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const internalKey = req.headers['x-internal-key'];
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, priceId, sessionId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    console.log(`Activating subscription for ${email} (Price: ${priceId})`);

    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found. Skipping DB update.');
        return res.status(200).json({ success: true, message: 'Activation processed without DB update.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    const updateData = {
        has_subscription: true,
        subscription_price_id: priceId,
        updated_at: new Date().toISOString()
    };

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is ' रहा है ' (not found)
        throw findError;
    }
    
    if (!existingUser) {
        console.log(`User ${email} not found. Creating new user.`);
        const { error: insertError } = await supabase
            .from('users')
            .insert({ email: email, ...updateData });
        if (insertError) throw insertError;
    } else {
        console.log(`User ${email} found. Updating subscription.`);
        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('email', email);
        if (updateError) throw updateError;
    }
    
    // Log every successful purchase for auditing
    await supabase.from('purchases').insert({
        email,
        price_id: priceId,
        session_id: sessionId,
        created_at: new Date().toISOString()
    });
    
    return res.status(200).json({ success: true, message: 'Subscription activated' });
  } catch (error: any) {
    console.error('Activation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
