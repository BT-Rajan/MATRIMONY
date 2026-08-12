import * as yup from 'yup';

const MOBILE = /^[6-9]\d{9}$/;

const req = (label) => yup.string().trim().required(`${label} தேவை`);
const reqId = (label) =>
  yup
    .number()
    .typeError(`${label} தேவை`)
    .required(`${label} தேவை`);

export const registrationSchema = yup.object({
  name: req('பெயர்').min(3, 'குறைந்தது 3 எழுத்துகள்').max(100),
  gender: yup.string().oneOf(['bride', 'groom'], 'பாலினம் தேவை').required('பாலினம் தேவை'),
  dob: yup
    .date()
    .typeError('பிறந்த தேதி தேவை')
    .required('பிறந்த தேதி தேவை')
    .max(new Date(), 'எதிர்கால தேதி அனுமதிக்கப்படாது'),
  gothram: yup.string().trim().max(100),
  address: req('முகவரி').max(500),
  star_id: reqId('நட்சத்திரம்'),
  rasi_id: reqId('ராசி'),
  quarter: yup.string().trim().max(150),
  education_id: reqId('கல்வி'),
  occupation_id: reqId('தொழில்'),
  father_name: req('தந்தை பெயர்').max(150),
  mother_name: req('தாய் பெயர்').max(150),
  native_place: req('சொந்த ஊர்').max(150),
  residence: req('தற்போதைய இருப்பிடம்').max(500),
  registrar_name: req('பதிவாளர் பெயர்').max(150),
  phone1: req('மொபைல் எண் 1').matches(MOBILE, 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை'),
  phone2: yup.string().trim().matches(MOBILE, { message: 'சரியான மொபைல் எண் தேவை', excludeEmptyString: true }),
  brothers: yup.number().typeError('எண் தேவை').min(0).max(20).required('சகோதரர்கள் தேவை'),
  sisters: yup.number().typeError('எண் தேவை').min(0).max(20).required('சகோதரிகள் தேவை'),
  participating: yup.string().oneOf(['yes', 'no'], 'இந்த புலம் தேவை').required('இந்த புலம் தேவை'),
  height_cm: yup.number().typeError('உயரம் தேவை').required('உயரம் தேவை').min(100, 'குறைந்தது 100 செ.மீ.').max(250),
  email: req('மின்னஞ்சல்').email('சரியான மின்னஞ்சல் தேவை'),
  password: req('கடவுச்சொல்').min(8, 'குறைந்தது 8 எழுத்துகள் தேவை'),
  password_confirmation: yup
    .string()
    .required('கடவுச்சொல்லை உறுதிப்படுத்தவும்')
    .oneOf([yup.ref('password')], 'கடவுச்சொற்கள் பொருந்தவில்லை'),
  payment_amount: yup.number().typeError('தொகை தேவை').positive('சரியான தொகை தேவை').required('தொகை தேவை'),
  payment_date: yup.date().typeError('கட்டண தேதி தேவை').required('கட்டண தேதி தேவை').max(new Date(), 'எதிர்கால தேதி அனுமதிக்கப்படாது'),
  payment_reference: req('குறிப்பு எண்').max(100),
});
