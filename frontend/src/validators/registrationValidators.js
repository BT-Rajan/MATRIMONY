import * as yup from 'yup';

const MOBILE = /^[6-9]\d{9}$/;

const req = (label) => yup.string().trim().required(`${label} தேவை`);
const reqId = (label) =>
  yup
    .number()
    .typeError(`${label} தேவை`)
    .required(`${label} தேவை`);

export const step1Schema = yup.object({
  registration_type: yup.string().oneOf(['bride', 'groom']).required('பதிவு வகை தேவை'),
  name_tamil: req('தமிழ் பெயர்').min(3, 'குறைந்தது 3 எழுத்துகள்').max(100),
  name_english: req('ஆங்கில பெயர்').min(3, 'குறைந்தது 3 எழுத்துகள்').max(100),
  dob: yup
    .date()
    .typeError('பிறந்த தேதி தேவை')
    .required('பிறந்த தேதி தேவை')
    .max(new Date(), 'எதிர்கால தேதி அனுமதிக்கப்படாது')
    .test('age', 'வயது 18 முதல் 60 வரை இருக்க வேண்டும்', (dob) => {
      if (!dob) return false;
      const age = (new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 18 && age <= 60;
    }),
  height_cm: yup.number().typeError('உயரம் தேவை').required('உயரம் தேவை').min(90).max(250),
  weight_kg: yup.number().typeError('எண் தேவை').min(20).max(250).nullable().transform((v, o) => (o === '' ? null : v)),
  marital_status: req('திருமண நிலை'),
  education_id: reqId('கல்வி'),
  occupation_id: reqId('தொழில்'),
  income_id: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
  religion_id: reqId('மதம்'),
  caste_id: reqId('சாதி'),
  sub_caste_id: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
  star_id: reqId('நட்சத்திரம்'),
  rasi_id: reqId('ராசி'),
  dosham_id: reqId('தோஷம்'),
  native_place: req('சொந்த ஊர்'),
  district_id: reqId('மாவட்டம்'),
  current_address: req('தற்போதைய முகவரி').min(15, 'குறைந்தது 15 எழுத்துகள்').max(500),
  pincode: yup.string().trim().matches(/^\d{6}$/, { message: 'சரியான 6 இலக்க பின்கோடு தேவை', excludeEmptyString: true }),
  state: req('மாநிலம்'),
  country: req('நாடு'),
  mobile: req('மொபைல் எண்').matches(MOBILE, 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை'),
  whatsapp: yup.string().trim().matches(MOBILE, { message: 'சரியான வாட்ஸ்அப் எண் தேவை', excludeEmptyString: true }),
  email: req('மின்னஞ்சல்').email('சரியான மின்னஞ்சல் தேவை'),
  about_myself: yup.string().max(2000, 'அதிகபட்சம் 2000 எழுத்துகள்'),
  diet: req('உணவுப் பழக்கம்'),
  smoking: req('புகைபிடித்தல் விவரம்'),
  drinking: req('மது அருந்துதல் விவரம்'),
  physically_challenged: req('இந்த புலம்'),
  password: req('கடவுச்சொல்').min(8, 'குறைந்தது 8 எழுத்துகள் தேவை'),
  password_confirmation: yup
    .string()
    .required('கடவுச்சொல்லை உறுதிப்படுத்தவும்')
    .oneOf([yup.ref('password')], 'கடவுச்சொற்கள் பொருந்தவில்லை'),
});

export const step2Schema = yup.object({
  birth_date: yup.date().typeError('பிறந்த தேதி தேவை').required('பிறந்த தேதி தேவை'),
  birth_time: req('பிறந்த நேரம்'),
  birth_place: req('பிறந்த இடம்'),
  star_id: reqId('நட்சத்திரம்'),
  rasi_id: reqId('ராசி'),
  lagnam: req('லக்னம்'),
  gothram: yup.string().nullable(),
  chevvai_dosham: req('செவ்வாய் தோஷம்'),
  rahu_dosham: req('ராகு தோஷம்'),
  kethu_dosham: req('கேது தோஷம்'),
  kalasarpa_dosham: req('கால சர்ப்ப தோஷம்'),
});

export const step3Schema = yup.object({
  father_name: req('தந்தை பெயர்'),
  mother_name: req('தாய் பெயர்'),
  father_occupation: yup.string().nullable(),
  father_native_place: yup.string().nullable(),
  father_mobile: yup.string().trim().matches(MOBILE, { message: 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை', excludeEmptyString: true }),
  father_email: yup.string().trim().email('சரியான மின்னஞ்சல் தேவை').nullable().transform((v) => (v === '' ? null : v)),
  mother_native_place: yup.string().nullable(),
  mother_mobile: yup.string().trim().matches(MOBILE, { message: 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை', excludeEmptyString: true }),
  birth_order: yup.string().nullable(),
  parents_alive: req('பெற்றோர் உயிருடன் உள்ளனரா'),
  brothers: yup.number().typeError('எண் தேவை').min(0).max(20).required(),
  married_brothers: yup
    .number()
    .typeError('எண் தேவை')
    .min(0)
    .max(20)
    .required()
    .test('le-brothers', 'மொத்த சகோதரர்களை விட அதிகமாக இருக்க முடியாது', function (v) {
      return (v ?? 0) <= (this.parent.brothers ?? 0);
    }),
  sisters: yup.number().typeError('எண் தேவை').min(0).max(20).required(),
  married_sisters: yup
    .number()
    .typeError('எண் தேவை')
    .min(0)
    .max(20)
    .required()
    .test('le-sisters', 'மொத்த சகோதரிகளை விட அதிகமாக இருக்க முடியாது', function (v) {
      return (v ?? 0) <= (this.parent.sisters ?? 0);
    }),
  family_type: req('குடும்ப வகை'),
  own_house: req('சொந்த வீடு'),
  family_income_id: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
});

export const step4Schema = yup.object({
  reference_name: req('பரிந்துரையாளர் பெயர்'),
  relationship_id: reqId('உறவுமுறை'),
  phone: req('தொலைபேசி எண்').matches(MOBILE, 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை'),
  address: yup.string().nullable(),
  known_since: yup.string().nullable(),
  remarks: yup.string().max(500, 'அதிகபட்சம் 500 எழுத்துகள்').nullable(),
});

export const step5Schema = yup.object({
  participating: yup.string().oneOf(['yes', 'no']).required(),
  event_id: yup.number().when('participating', {
    is: 'yes',
    then: (s) => s.typeError('நிகழ்வு தேவை').required('நிகழ்வு தேவை'),
    otherwise: (s) => s.nullable(),
  }),
  batch: yup.string().when('participating', {
    is: 'yes',
    then: (s) => s.required('தொகுதி தேவை'),
    otherwise: (s) => s.nullable(),
  }),
  food_preference: yup.string().when('participating', {
    is: 'yes',
    then: (s) => s.required('உணவு விருப்பம் தேவை'),
    otherwise: (s) => s.nullable(),
  }),
  payment_type_id: yup.number().when('participating', {
    is: 'yes',
    then: (s) => s.typeError('கட்டண வகை தேவை').required('கட்டண வகை தேவை'),
    otherwise: (s) => s.nullable(),
  }),
  amount: yup.number().when('participating', {
    is: 'yes',
    then: (s) => s.typeError('தொகை தேவை').moreThan(0, 'தொகை பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்').required(),
    otherwise: (s) => s.nullable(),
  }),
  transaction_number: yup.string().when('participating', {
    is: 'yes',
    then: (s) => s.required('பரிவர்த்தனை எண் தேவை'),
    otherwise: (s) => s.nullable(),
  }),
});
