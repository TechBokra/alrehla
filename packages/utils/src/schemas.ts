
import { z } from 'zod';
import { PersonalizedProduct } from '@alrehla/types';

// تعبير نمطي لأرقام الهواتف المصرية (يبدأ بـ 01 ويتبعه 9 أرقام)
const phoneRegex = /^01[0125][0-9]{8}$/;

// دالة للتحقق من صحة البريد الإلكتروني
const isValidEmail = (email: string | undefined): boolean => {
  if (!email || email.trim() === '') return false;
  return z.string().email().safeParse(email).success;
};

// Base Schema parts
export const childDetailsSchema = z.object({
  childName: z.string().min(1, "اسم الطفل مطلوب"),
  childBirthDate: z.string().min(1, "تاريخ الميلاد مطلوب"),
  childGender: z.enum(['ذكر', 'أنثى'], { errorMap: () => ({ message: "الجنس مطلوب" }) }),
});

// Define the interface explicitly to ensure all fields are typed correctly
// regardless of the dynamic schema generation logic.
export interface OrderFormValues {
  childName: string;
  childBirthDate: string;
  childGender: 'ذكر' | 'أنثى';
  deliveryType: 'printed' | 'electronic';
  shippingOption: 'my_address' | 'gift';
  governorate?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  giftMessage?: string;
  sendDigitalCard?: boolean;
  storyValue?: string;
  customGoal?: string;
  // Dynamic fields
  [key: string]: any;
}

// Function to generate dynamic schema based on product configuration
export const createOrderSchema = (product: PersonalizedProduct | undefined) => {
  if (!product) return z.object({});

  // 1. Child Details (Always present)
  let schemaObject: any = {
    ...childDetailsSchema.shape,
    deliveryType: z.enum(['printed', 'electronic']),
    shippingOption: z.enum(['my_address', 'gift']),
    governorate: z.string().optional(),
    recipientName: z.string().optional(),
    recipientAddress: z.string().optional(),
    recipientPhone: z.string().optional(),
    recipientEmail: z.string().optional(),
    giftMessage: z.string().optional(),
    sendDigitalCard: z.boolean().optional(),
    storyValue: z.string().optional(),
    customGoal: z.string().optional(),
  };

  const isLibraryBook = product.product_type === 'library_book';

  // 2. Dynamic fields. Library fields are limited to configured cover fields.
  if (product.text_fields) {
    product.text_fields.forEach((field) => {
      if (field.required) {
        schemaObject[field.id] = z.string().min(1, `${field.label.replace('*', '')} مطلوب`);
      } else {
        schemaObject[field.id] = z.string().optional();
      }
    });
  }

  // 3. Goal Config Validation (custom journey only)
  if (!isLibraryBook && product.goal_config !== 'none') {
    schemaObject.storyValue = z.string().min(1, "الهدف من القصة مطلوب");
  }

  // 4. Image Slots
  if (product.image_slots) {
    product.image_slots.forEach((slot) => {
      if (slot.required) {
        schemaObject[slot.id] = z.any().refine((val) => val instanceof File || (typeof val === 'string' && val.length > 0), {
          message: `${slot.label} مطلوب`,
        });
      } else {
        schemaObject[slot.id] = z.any().optional();
      }
    });
  }

  // Build the base schema
  let baseSchema = z.object(schemaObject);

  // Add Refinements (Cross-field validation)
  return baseSchema.superRefine((data, ctx) => {
    // Custom Goal Validation
    if (!isLibraryBook && (product.goal_config === 'custom' || (product.goal_config === 'predefined_and_custom' && data.storyValue === 'custom'))) {
      if (!data.customGoal || data.customGoal.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "الرجاء كتابة الهدف المخصص",
          path: ["customGoal"],
        });
      }
    }

    // Shipping & Gift Validation (Strict Checks)
    if (data.deliveryType === 'printed') {
       // Validate Governorate specifically
       if (!data.governorate || data.governorate.trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "المحافظة مطلوبة لحساب الشحن", path: ["governorate"] });
       }

       if (data.shippingOption === 'gift' || data.shippingOption === 'my_address') {
          if (!data.recipientName || data.recipientName.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "اسم المستلم مطلوب", path: ["recipientName"] });
          }
          if (!data.recipientAddress || data.recipientAddress.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "العنوان التفصيلي مطلوب", path: ["recipientAddress"] });
          }
          
          // الهاتف: يجب أن يكون أرقاماً فقط ويتبع التنسيق
          if (!data.recipientPhone || !phoneRegex.test(data.recipientPhone)) {
            ctx.addIssue({ 
              code: z.ZodIssueCode.custom, 
              message: "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)", 
              path: ["recipientPhone"] 
            });
          }
       }

       // البريد الإلكتروني: التحقق الموحد
       if (data.sendDigitalCard && !data.recipientEmail?.trim()) {
         ctx.addIssue({ 
           code: z.ZodIssueCode.custom, 
           message: "البريد الإلكتروني مطلوب لإرسال البطاقة الرقمية", 
           path: ["recipientEmail"] 
         });
       } else if (data.recipientEmail && !isValidEmail(data.recipientEmail)) {
         ctx.addIssue({ 
           code: z.ZodIssueCode.custom, 
           message: "صيغة البريد الإلكتروني غير صحيحة", 
           path: ["recipientEmail"] 
         });
       }
    }
  });
};
