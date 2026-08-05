-- Run AFTER 003_pass2_masters.sql.
-- Seeds standard reference lists. Admins extend these further via the
-- Masters CRUD screens (Caste/Sub-Caste/Taluk/Village in particular are
-- meant to be built out by the admin for their actual community).

USE karkathar_matrimony;

-- ---------------- Religions ----------------
INSERT INTO religions (name_tamil, name_english, sort_order) VALUES
('இந்து', 'Hindu', 1),
('கிறிஸ்தவர்', 'Christian', 2),
('முஸ்லிம்', 'Muslim', 3),
('சீக்கியர்', 'Sikh', 4),
('ஜைனர்', 'Jain', 5),
('பிற', 'Other', 6);

-- A small starter set of castes under Hindu, so the hierarchy has
-- something to demonstrate immediately — admin extends via the UI.
INSERT INTO castes (religion_id, name_tamil, name_english, sort_order)
SELECT id, 'வேளாளர்', 'Vellalar', 1 FROM religions WHERE name_english = 'Hindu';
INSERT INTO castes (religion_id, name_tamil, name_english, sort_order)
SELECT id, 'முதலியார்', 'Mudaliar', 2 FROM religions WHERE name_english = 'Hindu';
INSERT INTO castes (religion_id, name_tamil, name_english, sort_order)
SELECT id, 'நாடார்', 'Nadar', 3 FROM religions WHERE name_english = 'Hindu';
INSERT INTO castes (religion_id, name_tamil, name_english, sort_order)
SELECT id, 'செட்டியார்', 'Chettiar', 4 FROM religions WHERE name_english = 'Hindu';

INSERT INTO sub_castes (caste_id, name_tamil, name_english, sort_order)
SELECT id, 'சைவ வேளாளர்', 'Saiva Vellalar', 1 FROM castes WHERE name_english = 'Vellalar';

-- ---------------- Districts (Tamil Nadu, 38) ----------------
INSERT INTO districts (name_tamil, name_english, sort_order) VALUES
('அரியலூர்', 'Ariyalur', 1),
('செங்கல்பட்டு', 'Chengalpattu', 2),
('சென்னை', 'Chennai', 3),
('கோயம்புத்தூர்', 'Coimbatore', 4),
('கடலூர்', 'Cuddalore', 5),
('தர்மபுரி', 'Dharmapuri', 6),
('திண்டுக்கல்', 'Dindigul', 7),
('ஈரோடு', 'Erode', 8),
('கள்ளக்குறிச்சி', 'Kallakurichi', 9),
('காஞ்சிபுரம்', 'Kanchipuram', 10),
('கன்னியாகுமரி', 'Kanyakumari', 11),
('கரூர்', 'Karur', 12),
('கிருஷ்ணகிரி', 'Krishnagiri', 13),
('மதுரை', 'Madurai', 14),
('மயிலாடுதுறை', 'Mayiladuthurai', 15),
('நாகப்பட்டினம்', 'Nagapattinam', 16),
('நாமக்கல்', 'Namakkal', 17),
('நீலகிரி', 'The Nilgiris', 18),
('பெரம்பலூர்', 'Perambalur', 19),
('புதுக்கோட்டை', 'Pudukkottai', 20),
('இராமநாதபுரம்', 'Ramanathapuram', 21),
('ராணிப்பேட்டை', 'Ranipet', 22),
('சேலம்', 'Salem', 23),
('சிவகங்கை', 'Sivaganga', 24),
('தென்காசி', 'Tenkasi', 25),
('தஞ்சாவூர்', 'Thanjavur', 26),
('தேனி', 'Theni', 27),
('தூத்துக்குடி', 'Thoothukudi', 28),
('திருச்சிராப்பள்ளி', 'Tiruchirappalli', 29),
('திருநெல்வேலி', 'Tirunelveli', 30),
('திருப்பத்தூர்', 'Tirupathur', 31),
('திருப்பூர்', 'Tiruppur', 32),
('திருவள்ளூர்', 'Tiruvallur', 33),
('திருவண்ணாமலை', 'Tiruvannamalai', 34),
('திருவாரூர்', 'Tiruvarur', 35),
('வேலூர்', 'Vellore', 36),
('விழுப்புரம்', 'Viluppuram', 37),
('விருதுநகர்', 'Virudhunagar', 38);

-- ---------------- Education ----------------
INSERT INTO educations (name_tamil, name_english, sort_order) VALUES
('பள்ளிப்படிப்பு', 'School Level', 1),
('டிப்ளமோ', 'Diploma', 2),
('இளங்கலை பட்டம்', 'Bachelor''s Degree', 3),
('முதுகலை பட்டம்', 'Master''s Degree', 4),
('முனைவர் பட்டம்', 'Doctorate (PhD)', 5),
('தொழில்முறை தகுதி (CA/CS/மருத்துவர்)', 'Professional (CA/CS/Doctor/Lawyer)', 6);

-- ---------------- Occupation ----------------
INSERT INTO occupations (name_tamil, name_english, sort_order) VALUES
('அரசு ஊழியர்', 'Government Employee', 1),
('தனியார் நிறுவன ஊழியர்', 'Private Sector Employee', 2),
('சொந்த தொழில் / வணிகர்', 'Business / Self-employed', 3),
('விவசாயி', 'Agriculturist', 4),
('பொறியாளர்', 'Engineer', 5),
('மருத்துவர்', 'Doctor', 6),
('ஆசிரியர் / பேராசிரியர்', 'Teacher / Professor', 7),
('வழக்கறிஞர்', 'Lawyer', 8),
('வெளிநாட்டில் பணிபுரிபவர்', 'Working Abroad', 9),
('வேலை தேடுகிறவர்', 'Not Employed / Seeking Job', 10);

-- ---------------- Income ----------------
INSERT INTO incomes (name_tamil, name_english, sort_order) VALUES
('ரூ.1 லட்சத்திற்கு கீழ்', 'Below ₹1 Lakh', 1),
('ரூ.1 - 3 லட்சம்', '₹1 - 3 Lakh', 2),
('ரூ.3 - 5 லட்சம்', '₹3 - 5 Lakh', 3),
('ரூ.5 - 10 லட்சம்', '₹5 - 10 Lakh', 4),
('ரூ.10 - 20 லட்சம்', '₹10 - 20 Lakh', 5),
('ரூ.20 லட்சத்திற்கு மேல்', 'Above ₹20 Lakh', 6);

-- ---------------- Star / Nakshatram (27) ----------------
INSERT INTO stars (name_tamil, name_english, sort_order) VALUES
('அஸ்வினி', 'Ashwini', 1),
('பரணி', 'Bharani', 2),
('கார்த்திகை', 'Karthikai', 3),
('ரோகிணி', 'Rohini', 4),
('மிருகசீரிடம்', 'Mrigasirisham', 5),
('திருவாதிரை', 'Thiruvathirai', 6),
('புனர்பூசம்', 'Punarpoosam', 7),
('பூசம்', 'Poosam', 8),
('ஆயில்யம்', 'Ayilyam', 9),
('மகம்', 'Magam', 10),
('பூரம்', 'Pooram', 11),
('உத்திரம்', 'Uthiram', 12),
('அஸ்தம்', 'Astham', 13),
('சித்திரை', 'Chithirai', 14),
('சுவாதி', 'Swathi', 15),
('விசாகம்', 'Visagam', 16),
('அனுஷம்', 'Anusham', 17),
('கேட்டை', 'Kettai', 18),
('மூலம்', 'Moolam', 19),
('பூராடம்', 'Pooradam', 20),
('உத்திராடம்', 'Uthiradam', 21),
('திருவோணம்', 'Thiruvonam', 22),
('அவிட்டம்', 'Avittam', 23),
('சதயம்', 'Sadhayam', 24),
('பூரட்டாதி', 'Poorattathi', 25),
('உத்திரட்டாதி', 'Uthirattathi', 26),
('ரேவதி', 'Revathi', 27);

-- ---------------- Rasi (12) ----------------
INSERT INTO rasis (name_tamil, name_english, sort_order) VALUES
('மேஷம்', 'Mesham (Aries)', 1),
('ரிஷபம்', 'Rishabam (Taurus)', 2),
('மிதுனம்', 'Mithunam (Gemini)', 3),
('கடகம்', 'Kadagam (Cancer)', 4),
('சிம்மம்', 'Simmam (Leo)', 5),
('கன்னி', 'Kanni (Virgo)', 6),
('துலாம்', 'Thulam (Libra)', 7),
('விருச்சிகம்', 'Viruchigam (Scorpio)', 8),
('தனுசு', 'Dhanusu (Sagittarius)', 9),
('மகரம்', 'Magaram (Capricorn)', 10),
('கும்பம்', 'Kumbam (Aquarius)', 11),
('மீனம்', 'Meenam (Pisces)', 12);

-- ---------------- Dosham ----------------
INSERT INTO doshams (name_tamil, name_english, sort_order) VALUES
('இல்லை', 'None', 1),
('செவ்வாய் தோஷம்', 'Chevvai Dosham', 2),
('ராகு தோஷம்', 'Rahu Dosham', 3),
('கேது தோஷம்', 'Kethu Dosham', 4),
('கால சர்ப்ப தோஷம்', 'Kalasarpa Dosham', 5),
('பிற', 'Other', 6);

-- ---------------- Relationship (for the Reference step) ----------------
INSERT INTO relationships (name_tamil, name_english, sort_order) VALUES
('தந்தை', 'Father', 1),
('தாய்', 'Mother', 2),
('சகோதரர்', 'Brother', 3),
('சகோதரி', 'Sister', 4),
('மாமா', 'Uncle', 5),
('அத்தை', 'Aunt', 6),
('குடும்ப நண்பர்', 'Family Friend', 7),
('உறவினர்', 'Relative', 8),
('நண்பர்', 'Friend', 9);

-- ---------------- Payment Type ----------------
INSERT INTO payment_types (name_tamil, name_english, sort_order) VALUES
('பணம்', 'Cash', 1),
('வங்கி பரிமாற்றம்', 'Bank Transfer', 2),
('UPI', 'UPI', 3),
('காசோலை', 'Cheque', 4),
('கார்டு', 'Card', 5);
