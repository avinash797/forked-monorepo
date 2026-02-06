import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface DishType {
    name: string;
    emoji: string;
    aliases: string[];
    taste_tags: string[];
}

interface GeminiResponse {
    dish_types: DishType[];
}

// Generate a URL-friendly slug from a name
function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Call Gemini Flash to get signature dishes for a city
async function getSignatureDishes(
    cityName: string,
    state: string,
    country: string
): Promise<GeminiResponse> {
    const prompt = `You are a culinary expert. Identify the signature dishes that ${cityName}, ${state}, ${country} is renowned for.

Return a JSON object with a "dish_types" array. Each dish type should have:
- "name": The dish name (e.g., "Cheesesteak", "Deep Dish Pizza")
- "emoji": A single relevant emoji
- "aliases": Array of alternative names (can be empty)
- "taste_tags": Array of 3-5 descriptive taste/texture tags (e.g., "cheesy", "crispy", "savory")

Rules:
- Only include dishes the city is GENUINELY famous for
- Return 0-10 dishes (empty array is valid for cities without signature dishes)
- Be specific (e.g., "Philly Cheesesteak" not just "Sandwich")
- Focus on local specialties, not just popular foods

Return ONLY valid JSON, no markdown code fences.

Example response:
{"dish_types":[{"name":"Cheesesteak","emoji":"🥩","aliases":["Philly Cheesesteak","Steak Sandwich"],"taste_tags":["cheesy","savory","meaty","griddled","oniony"]}]}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown code fences if present
    text = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    try {
        return JSON.parse(text);
    } catch {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid JSON from Gemini');
    }
}

Deno.serve(async (req: Request) => {
    try {
        // Only accept POST
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                {
                    status: 405,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Validate environment
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(
                JSON.stringify({
                    error: 'Supabase environment not configured',
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const { city_id, city_name, state, country } = await req.json();

        if (!city_id || !city_name) {
            return new Response(
                JSON.stringify({ error: 'Missing city_id or city_name' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Enriching city: ${city_name}, ${state}, ${country}`);

        // Get signature dishes from Gemini
        const geminiResult = await getSignatureDishes(
            city_name,
            state || '',
            country || 'USA'
        );

        if (!geminiResult.dish_types || geminiResult.dish_types.length === 0) {
            console.log(`No signature dishes found for ${city_name}`);
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No signature dishes found',
                    dishes_added: 0,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client with service role
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        let dishesAdded = 0;
        let tagsAdded = 0;

        for (const dish of geminiResult.dish_types) {
            // Check if dish type already exists (case-insensitive)
            const { data: existingDish } = await supabase
                .from('dish_types')
                .select('id')
                .ilike('name', dish.name)
                .single();

            let dishTypeId: string;

            if (existingDish) {
                // Reuse existing dish type
                dishTypeId = existingDish.id;
                console.log(`Reusing existing dish type: ${dish.name}`);
            } else {
                // Insert new dish type
                const { data: newDish, error: insertError } = await supabase
                    .from('dish_types')
                    .insert({
                        name: dish.name,
                        slug: slugify(dish.name),
                        emoji: dish.emoji,
                        aliases: dish.aliases || [],
                        is_active: true,
                    })
                    .select('id')
                    .single();

                if (insertError) {
                    console.error(
                        `Failed to insert dish type ${dish.name}:`,
                        insertError
                    );
                    continue;
                }

                dishTypeId = newDish.id;
                dishesAdded++;
                console.log(`Created new dish type: ${dish.name}`);
            }

            // Link city to dish type (ignore duplicates)
            const { error: linkError } = await supabase
                .from('city_known_dishes')
                .upsert(
                    { city_id, dish_type_id: dishTypeId },
                    {
                        onConflict: 'city_id,dish_type_id',
                        ignoreDuplicates: true,
                    }
                );

            if (linkError) {
                console.error(`Failed to link city to dish type:`, linkError);
            }

            // Add taste tags
            for (const tagName of dish.taste_tags || []) {
                // Check if tag exists (case-insensitive)
                const { data: existingTag } = await supabase
                    .from('taste_tags')
                    .select('id')
                    .ilike('name', tagName)
                    .single();

                if (!existingTag) {
                    // Insert new tag
                    const { error: tagError } = await supabase
                        .from('taste_tags')
                        .insert({
                            name: tagName,
                            slug: slugify(tagName),
                            dish_type_id: dishTypeId,
                        });

                    if (!tagError) {
                        tagsAdded++;
                    } else if (!tagError.message?.includes('duplicate')) {
                        console.error(
                            `Failed to insert tag ${tagName}:`,
                            tagError
                        );
                    }
                }
            }
        }

        // Activate the city now that it has dish types
        const { error: activateError } = await supabase
            .from('cities')
            .update({ is_active: true })
            .eq('id', city_id);

        if (activateError) {
            console.error(
                `Failed to activate city ${city_name}:`,
                activateError
            );
        } else {
            console.log(`Activated city: ${city_name}`);
        }

        console.log(
            `Enrichment complete for ${city_name}: ${dishesAdded} dishes, ${tagsAdded} tags added`
        );

        return new Response(
            JSON.stringify({
                success: true,
                city_name,
                city_activated: !activateError,
                dishes_processed: geminiResult.dish_types.length,
                dishes_added: dishesAdded,
                tags_added: tagsAdded,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
