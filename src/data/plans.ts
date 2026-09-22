import { Plan } from '@/types';

export const PLANS: Plan[] = [
  {
    id: 'basic',
    nameAr: 'الأساسية',
    taglineAr: 'بداية مثالية للمشاهدة الفردية',
    monthlyPrice: 29,
    yearlyPrice: 290,
    quality: 'HD 720p',
    screens: 1,
    featuresAr: [
      'مشاهدة على شاشة واحدة',
      'جودة HD 720p',
      'وصول لجميع القنوات المباشرة',
      'مكتبة الأفلام والمسلسلات',
      'إلغاء في أي وقت',
    ],
  },
  {
    id: 'standard',
    nameAr: 'القياسية',
    taglineAr: 'الأكثر شعبية للعائلات الصغيرة',
    monthlyPrice: 49,
    yearlyPrice: 490,
    quality: 'Full HD 1080p',
    screens: 2,
    highlighted: true,
    featuresAr: [
      'مشاهدة على شاشتين في وقت واحد',
      'جودة Full HD 1080p',
      'وصول لجميع القنوات المباشرة',
      'مكتبة الأفلام والمسلسلات كاملة',
      'تحميل للمشاهدة دون اتصال',
      'بدون إعلانات',
    ],
  },
  {
    id: 'premium',
    nameAr: 'المميزة',
    taglineAr: 'أفضل تجربة بجودة فائقة',
    monthlyPrice: 79,
    yearlyPrice: 790,
    quality: 'Ultra HD 4K',
    screens: 4,
    featuresAr: [
      'مشاهدة على 4 شاشات في وقت واحد',
      'جودة Ultra HD 4K + HDR',
      'وصول لجميع القنوات المباشرة',
      'مكتبة الأفلام والمسلسلات كاملة',
      'تحميل للمشاهدة دون اتصال',
      'بدون إعلانات',
      'محتوى حصري ومبكر',
      'دعم فني ذو أولوية',
    ],
  },
];

export const getPlan = (id?: string) => PLANS.find((p) => p.id === id);
