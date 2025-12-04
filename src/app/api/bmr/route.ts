import { NextResponse } from 'next/server';

type Profile = {
  age: number;
  sex?: string;
  height_cm: number;
  weight_kg: number;
  activity_level?: string;
  goal?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const p: Profile = body.profile;
    if (!p) return NextResponse.json({ error: 'Missing profile' }, { status: 400 });

    const age = Number(p.age);
    const sex = (p.sex || 'male').toLowerCase();
    const height = Number(p.height_cm);
    const weight = Number(p.weight_kg);
    const activity = (p.activity_level || 'moderate').toLowerCase();
    const goal = (p.goal || 'maintain').toLowerCase();

    const bmrBase = 10 * weight + 6.25 * height - 5 * age;
    const bmr = sex === 'male' ? bmrBase + 5 : bmrBase - 161;

    const activityMap: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const multiplier = activityMap[activity] ?? 1.55;
    const tdee = bmr * multiplier;

    let targetCalories = tdee;
    if (goal === 'fat_loss') targetCalories = tdee - 500;
    if (goal === 'bulk') targetCalories = tdee + 400;

    const proteinFactor = goal === 'fat_loss' ? 2.2 : goal === 'bulk' ? 2.5 : 1.8;
    const proteinG = +(proteinFactor * weight).toFixed(1);
    const proteinCals = proteinG * 4;

    const fatCals = +(0.25 * targetCalories).toFixed(2);
    const fatG = +((fatCals / 9)).toFixed(1);

    const carbsCals = +(targetCalories - proteinCals - fatCals).toFixed(2);
    const carbsG = +((carbsCals / 4)).toFixed(1);

    const response = {
      bmr: +bmr.toFixed(2),
      tdee: +tdee.toFixed(2),
      target_calories: Math.round(targetCalories),
      macros: {
        protein_g: proteinG,
        carbs_g: carbsG,
        fat_g: fatG
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('bmr error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
