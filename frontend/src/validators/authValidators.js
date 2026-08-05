import * as yup from 'yup';

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const memberLoginSchema = yup.object({
  identifier: yup
    .string()
    .required('மொபைல் எண் அல்லது மின்னஞ்சல் தேவை')
    .test(
      'is-mobile-or-email',
      'சரியான மொபைல் எண் (10 இலக்கம்) அல்லது மின்னஞ்சலை உள்ளிடவும்',
      (value) => {
        if (!value) return false;
        const isEmail = yup.string().email().isValidSync(value);
        const isMobile = MOBILE_REGEX.test(value.trim());
        return isEmail || isMobile;
      }
    ),
  password: yup.string().required('கடவுச்சொல் தேவை').min(6, 'குறைந்தது 6 எழுத்துகள் தேவை'),
});

export const adminLoginSchema = yup.object({
  username: yup.string().required('பயனர் பெயர் தேவை'),
  password: yup.string().required('கடவுச்சொல் தேவை').min(6, 'குறைந்தது 6 எழுத்துகள் தேவை'),
});

export { MOBILE_REGEX };
