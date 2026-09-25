-- ============================================================
-- ResearchHub - DATA INSERT SCRIPT
-- Paste this whole script into the Supabase SQL Editor and click Run.
-- Safe to run more than once (duplicate codes are skipped).
-- Requires: supabase.sql (tables) to have been run first.
-- ============================================================

-- 1) Make sure the BSBA program exists in the programs table
INSERT INTO programs (name, code)
VALUES ('Business Administration', 'BSBA')
ON CONFLICT DO NOTHING;

-- 2) Store the library call numbers in their own column
ALTER TABLE research ADD COLUMN IF NOT EXISTS call_number TEXT;

-- 3) Insert the research works
--    code format matches the app: RS-<year>-<sequence>
WITH src (code, title, authors, year, call_number, abstract) AS (
  VALUES
  -- ============================ 2025 ============================
  ('RS-2025-0001',
   'Perceptions of Business Safety and Security Performance of KTV Bars in Bislig City',
   'Concha, Hannah Sophia Y., Samontina, Rejean S., Suarez, Jayasinth Ann V., Revilleza, Alliah Mae F.',
   2025, 'C744p',
   'This study examines the perceptions of the identified respondents or customers regarding the subject within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to describe these perceptions and provide insights that may be useful for planning, management, or service improvement.'),

  ('RS-2025-0002',
   'Financial Literacy Towards Loan Propensity Among Secondary Deped Teacher in Bislig City',
   'Albios, Rommel K., Havana, Karyle Mae L., Marapao, Cirilo V., Revilleza, Alyssa Mae F.',
   2025, 'Al337f',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2025-0003',
   'Perceptions of Green Marketing Practices Towards the Purchasing Behavior of Customers in Cafes and Coffee Shops in Mangagoy, Bislig City',
   'Cagorol, Kate Allen F., Cuario, Cendel L., Nantes, Divine Grace C., Villanueva, Eddie L. jr.',
   2025, 'C131p',
   'This study examines the perceptions of the identified respondents or customers regarding the subject within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to describe these perceptions and provide insights that may be useful for planning, management, or service improvement.'),

  ('RS-2025-0004',
   'Operational Practices On Sustainability Towards Profitability of Restaurant Businesses in Mangagoy, Bislig City',
   'Andao, Alexa C., Belaya, Jay-Ann N., Japus, Jessa Fatima S.',
   2025, 'An543o',
   'This study examines the practices and conditions associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide practical insights that may support improved management, service delivery, and organizational or business performance.'),

  ('RS-2025-0005',
   'Relationship of the Employability Skills and Employability Outcomes of the BSBA Graduates Batch 2022-2024 of De La Salle John Bosco College',
   'Apa, Mica T., Ambita, Princess Jhane Kaizza E., Tair, Lorie Mae A., Tupas, Mary Joy B.',
   2025, 'Ap639r',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2025-0006',
   'Operational Challenges Towards Decision-Making Skills Among Coffee Shop in Mangagoy, Bislig City',
   'Dela Salde, Danielle Kate P., Caluban, Ella Magne D., Fajardo, Leah G.',
   2025, 'D331o',
   'This study examines the practices and conditions associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide practical insights that may support improved management, service delivery, and organizational or business performance.'),

  ('RS-2025-0007',
   'Service Quality of Catering Operations towards Sustainability of Restaurant Businesses in Bislig City',
   'Lisondra, Stephanie, Cervantes, Liza Mae, Montanez, Christian Louie, Domogoy, Ronabelle',
   2025, 'L771s',
   'This study examines the practices and conditions associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide practical insights that may support improved management, service delivery, and organizational or business performance.'),

  ('RS-2025-0008',
   'Water Refilling Station in De La Salle John Bosco College: A Feasibility Study',
   'Soquite, Prencess Jane V., Dain, Reizel Fae I., Atendido, Reca R.',
   2025, 'So712w',
   'This study examines the feasibility of the proposed project described in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to assess their relevance to the identified population, organization, or business context. It is intended to provide a basis for assessing whether the proposed venture or facility can be practically implemented and sustained in the stated setting.'),

  ('RS-2025-0009',
   'Vertical Mud Crab Farming Using Recirculator Aquaculture Systems in San Fernando, Bislig City: A Feasibility Study',
   'Duena, Charlie S., Godarido, Angelina T.',
   2025, 'D852v',
   'This study examines the feasibility of the proposed project described in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to assess their relevance to the identified population, organization, or business context. It is intended to provide a basis for assessing whether the proposed venture or facility can be practically implemented and sustained in the stated setting.'),

  ('RS-2025-0010',
   'A Commercial Tilapia Monoculture Farming Venture in San Fernando, Bislig City: A Feasibility Study',
   'Bayo, Jezyl Mae C., Samson, Ara Mae M., Adventurado, Joseph Miguel T.',
   2025, 'B361c',
   'This study examines the feasibility of the proposed project described in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to assess their relevance to the identified population, organization, or business context. It is intended to provide a basis for assessing whether the proposed venture or facility can be practically implemented and sustained in the stated setting.'),

  ('RS-2025-0011',
   'Student Dorminatory at De La Salle John Bosco College: A Feasibility Study',
   'Casinginan, Hannie C., Nolasco, Angel C., Orillo, Deza C.',
   2025, 'C339s',
   'This study examines the feasibility of the proposed project described in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to assess their relevance to the identified population, organization, or business context. It is intended to provide a basis for assessing whether the proposed venture or facility can be practically implemented and sustained in the stated setting.'),

  -- ============================ 2024 ============================
  ('RS-2024-0001',
   'Factors Influencing Employees'' Retention in De La Salle John Bosco College',
   'Bedolido, Helary B., Manlucob, Shanine B., Tampos, Laarni Jane F.',
   2024, 'B412f',
   'This study examines the factors or determinants associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to identify relevant considerations that may help stakeholders understand the issue and guide appropriate decisions or improvements.'),

  ('RS-2024-0002',
   'Employees'' Satisfaction and Organizational Effeciency Among Small and Medium-Sized Enterprises in Mangagoy, Bislig City',
   'Monin, Marcelo G., Hinayon, Maria Cecilis B., Dandoy, Karyme Collein L.',
   2024, 'M744e',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2024-0003',
   'Influences Affectiveness Employees'' Engagement Towards Work Productivity at De La Salle John Bosco College',
   'Gale, Jane Nikka P., Loreto, Rowena D., Ocampo, Angle A.',
   2024, 'G154i',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2024-0004',
   'Determinants of Customer Satisfaction Towards Quality of Service Among Selected Beauty Salons in Mangagoy, Bislig City',
   'Bagohin, Aubrey Mae M., Acierto, Krystel Shane A., Buling, Kristine P.',
   2024, 'B148d',
   'This study examines the factors or determinants associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to identify relevant considerations that may help stakeholders understand the issue and guide appropriate decisions or improvements.'),

  ('RS-2024-0005',
   'Elements Influencing Customers Loyalty in Non-Banking Institutions of Mangagoy, Bislig City',
   'Agorto, Berlin Mae M., Banda, Mae Ann B., Cacayan, Louie Mark L., Fernandez, Ryan C.',
   2024, 'Ag275e',
   'This study examines the factors or determinants associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to identify relevant considerations that may help stakeholders understand the issue and guide appropriate decisions or improvements.'),

  ('RS-2024-0006',
   'Saving Behavior Towards Employees Preparedness for Financial Freedom in De La Salle John Bosco College',
   'Gingeo, Althea Nicole L., Mating, Desiree B., Ros, Bhea May B.',
   2024, 'G492s',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2024-0007',
   'Influence of Marketing Mix Elements on the Sales Performance of Restaurants in Mangagoy, Bislig City',
   'Avila, Joy Suzanne S., Elan, Erwin Vincent C., Villarba, Luxmie D.',
   2024, 'Av958i',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  -- ============================ 2023 ============================
  ('RS-2023-0001',
   'Financial Behavior Among Higher Education Students at De La Salle John Bosco College: Implications of Financial Literacy',
   'Bayo, Juliet Mae C., Estrera, John Micheal L., Faelnar, Meichaella C., Jumawid, Jessa Mae S.',
   2023, 'B361f',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2023-0002',
   'Perceived Effects of Credit Trust to the Financial Performance of Micro and Small Enterprises (MSEs) in Mangagoy, Bislig City',
   'Irish Mae Duero, John Micheal Murio, Jocel Matildo',
   2023, 'D853p',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2023-0003',
   'Factors Influencing Students Decision on Enrolling Accountancy Program at De La Salle John Bosco College',
   'Cuya, Jumary A., Igne, Lorife Ann O., Verano, Julissa Mae F.',
   2023, 'C993f',
   'This study examines the factors or determinants associated with the subject identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to identify relevant considerations that may help stakeholders understand the issue and guide appropriate decisions or improvements.'),

  ('RS-2023-0004',
   'Perceptions on Mobile Payment Modes Among De La Salle John Bosco College Employees in Mangagoy, Bislig City',
   'Nagara, Cherline Cris, Nepomuceno, Joricel, Villagonza, Vincent Joseph',
   2023, 'N147p',
   'This study examines the perceptions of the identified respondents or customers regarding the subject within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to describe these perceptions and provide insights that may be useful for planning, management, or service improvement.'),

  ('RS-2023-0005',
   'Financial Coping Strategies and the Academic Performance of Higher Education Students of De La Salle John Bosco College',
   'Cedro, Sergie Jr. T., Oronan, Mery Jane M., Pernda, Tresha S.',
   2023, 'C389f',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2023-0006',
   'Impact of Financial Status on College Students Academic Behavior at De La Salle John Bosco College',
   'Caumanday, Erica M., Basanez, Angelica R., Montadas, Alberto Jr D.',
   2023, 'C373i',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2023-0007',
   'Impact of Corporate Social Responsibility to the Financial Performances Among SMEs in Mangagoy, Bislig City',
   'Campos, Ricarte A., Delagan, Vannah Mae G.',
   2023, 'C198i',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2023-0008',
   'Implications of Proper Bookkeeping to the Small Enterprises in Mangagoy, Bislig City',
   'Caroro, Donna Jane L., Gascon, Edelyn M., Porras, Mardy Joy M.',
   2023, 'C293i',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2023-0009',
   'The Buying Decision on the Online Marketplace Purchases of the College Students in De La Salle John Bosco College',
   'Macarine, Kevin A., Emadin, Pops M., Balboa, Alexis John S.',
   2023, 'M175b',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2023-0010',
   'Implications of Debt Management on the Profitability of Small-Scale Enterprises in Mangagoy, Bislig City',
   'Bartolazo, Mellinie B., Delos Santos, Marlinie L., Naraga, Ma. Angelika P., Variacion, Dicky Jr. P.',
   2023, 'M526i',
   'This study examines the relationship, influence, impact, effects, or implications identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study aims to provide evidence that may help the concerned stakeholders better understand the topic and its practical significance.'),

  ('RS-2023-0011',
   'Radio Advertisement Technology Application in the Higher Education Department of De La Salle John Bosco College: An Evaluation Study',
   'Lida Marie Castro, Alaxes Dandoy, Jaylord Apa',
   2023, 'C355r',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  ('RS-2023-0012',
   'Purchasing Decision on Live Streaming E-Commerce of Senior High School Students in De La Salle John Bosco College',
   'Mendoza, Glory Mae, Olario, Arlord Bryan, Virtudazo, Freya Grace',
   2023, 'M539p',
   'This study examines the subject and context identified in the title within the stated setting. It considers the key variables or concerns represented by the study topic and seeks to describe or assess their relevance to the identified population, organization, or business context. The study is intended to provide organized information and practical insights that may be useful to the stakeholders concerned.'),

  -- ============================ 2022 ============================
  ('RS-2022-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Michele Lemarda, Jenny Rose Ganzon, Andrea Carbonilla',
   2022, 'L839u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2022-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City Surigao Del Sur, Philippines',
   'Bestorillo, Narcita D., Pontod, Jhona Grace M., Tagupa, Micaela Shalimar A.',
   2022, 'B561u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2022-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City Surigao Del Sur, Philippines',
   'Treshia Cleen D. Basut, Erica Mae S. Orcullo, Jena Marie A. Uriarte',
   2022, 'B327u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2022-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Kristine D. Bacus, Jinlie Monica P. Castillo, Leah Mae Q. Platil, Jesica O. Rendon',
   2022, 'B131u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2022-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City Surigao Del Sur, Philippines',
   'Charmie Yvon R. Fronteras, Nova Mae O. Rebuyon, Roxen Shane C. Adante',
   2022, 'F935u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2022-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City Surigao Del Sur, Philippines',
   'Managa, Jetlee L., Valencia, Zeta Love T., Villamo, Pedro III M.',
   2022, 'M266u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2022-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Mery Jessica P. Alegre, Leann Mae P. Banajera, Jesumito Kenji M. Tanaka',
   2022, 'Al366u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2021 ============================
  ('RS-2021-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Mary Grace G. Langres, Rondie Sansan, Maricel L. Gumilao',
   2021, 'L285u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Roseville M. Mejores, Annie Jane F. Masabot, Joshua Harvey M. Omol',
   2021, 'R817u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Sariah M. Miole, Mery Flor P. Maputol, Venus B. Artiza',
   2021, 'M669u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Cordova, Angelie B., Abarquez, Digna B., Leongas, Rejane G.',
   2021, 'C796u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Nigel T. Gersana, Galacia S. Milladas, Julaimie R. Toling',
   2021, 'G381u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Casipong, Lury Jean O., Ong, Cyryl C., Salas, Lou T., Samontina, Carol C.',
   2021, 'C339u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Eliezer B. Eleazar, Eryl May T. Galopo, Jayrose E. Flores',
   2021, 'El38u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0008',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City',
   'Dando, Ruth B., Garay, Whizkeen Joy S., Aloz, Mecel S.',
   2021, 'D177u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0009',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City Surigao Del Sur, Philippines',
   'Chiennie Via R. Codera, Angel Ann Astorga, Alvine M. Miel',
   2021, 'C669u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2021-0010',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Juvy Mae D. Tabugon, Marie Fhe B. Tariman, Jonah Praise D. Fejo, Ronnel T. Tan',
   2021, 'T114u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2020 ============================
  ('RS-2020-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Tiodianco, Edsel O., Cagadas, Ehdsly P., Antonio, Ailyn P., Maraveles, Elmer S.',
   2020, 'T594u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2020-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Pertacorta, Chanda O., Balbuena, Theressa A., Cuarez, Charlene C.',
   2020, 'P468u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2020-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Anlene A. Gayo, Angela B. Belarmino, Cherie C. Gregorio',
   2020, 'G288u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2019 ============================
  ('RS-2019-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Marlon E. Bonotan, May O. Pertacoria, Lee L. Benson',
   2019, 'B719u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Sophia Mae S. Sinugbuhan, Daphney Gay S. Reyes, Hanna Marie C. Rances',
   2019, 'Si618u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Muyco, Eljoy O., Berdin, Belshi Mae R., Pundato, Mecaya S.',
   2019, 'M993u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Sajorga, Jenny Mae D., Sampayan, Aga E.',
   2019, 'Sa158u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Ma. Contessa H. Arcaya, Mary Rose E. Lungay, Gabrielle Angelo M. Nazareno, Joshephine T. Peligro, Arianne Joy G. Pitos',
   2019, 'Ar668u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Perlas, Mariel Grace D., Monin, Angelou G., Saropio, Zaldie E.',
   2019, 'P451u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Ma Teresa T. Rosell, Glyndel A. Rojas, Roselyn V. Otto',
   2019, 'R811u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0008',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Marepe D. Abenon, Paul Michael D. Gonia, Donna Flor T. De Castro',
   2019, 'G638u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0009',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Evan Marie L. Laspinas, Angelie G. Sayeon, Carlon A. Pamugas',
   2019, 'Sa274u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0010',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Angelica P. Montero, Jackelyn M. Muego, Sherlyn M. Ochea',
   2019, 'M778u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2019-0011',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Garcia, Rosheen Pearl M., Utagan, Geraldine T., Roscles, Charlene A.',
   2019, 'G216u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2018 ============================
  ('RS-2018-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Mindana, Sweetly L., Casil, Primie Floren B., Josafat, Carlo V.',
   2018, 'M663u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'John Carlo M. Musad, April Joy A. Osano, Melody M. Puliran, Jacky Lyn C. Rengel',
   2018, 'M985u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Marrien G. Lamig, Willis E. Simyunn, Jonell P. Mabido',
   2018, 'L231u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Gilbert A. Mantilla, Erroll O. Belsondra, Joe Ann Y. Balajola',
   2018, 'M292u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College La Salle Drive, Mangagoy, Bislig City',
   'Catherine Mae T. Ana, Rowena D. Barro, Karen M. Golocino',
   2018, 'An532u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Jesser M. Alvarado, Diana Rose D. Degamon, Ruffa L. Salte, Princess E. Sotto',
   2018, 'Al472u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Mary Jane O. Agravante, Jan Michael T. Carmona, Angela E. Tubo',
   2018, 'Ag277u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2018-0008',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Dela Cruz, Jienneca K., Esmale, Rucikyn G., Delgado, Jazel A., Beron, Rizza A.',
   2018, 'D331u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2017 ============================
  ('RS-2017-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Calajesan, Archie Melody A., Casilum, Maria Jessa C., Cruiz, Daisy Jane, Jale, Jay-Ann P.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Agnilar, Sushine Mae S., Dominguito, Kristia N., Calising, Rina B., Ovila, Aprily O.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Molina, Larience Keth P., Neri, Merlinda R., Pacatan, Rethny G., Ronquillo, Johanna B.',
   2017, 'M722u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Fernandez, Pearly Ann B., Villezon, Maria Ariane V., Suan, Pamela D., Logronio, Rosemarie V.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Camino, May Ann, Montajes, Ariel A., Mula, Arnel H.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Magbanua, Ailyn G., Serrano, Corina B., Galano, Ismael J., Sereno, Cecile V.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Pena, Lyn M., Amoroto, Mel Ian M., Dela Cruz, Rodylyn L., Durano, Tanya Loraine V.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2017-0008',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Abariles, Rose Ann P., Balansag, Chalene C., Fermilan, Dhafnie B., Perlas, Mj Ramir G.',
   2017, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2016 ============================
  ('RS-2016-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Bebita, April Joy G., Delfino, Che Ann A., Gales, Janifer P., Serna, Janeth J.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Ybanez, Mirachel P., Camino, MaryJane C., Rorrefranca, Menchie P., Becira, Joy Paul J., Galot, Chovit Mark J., Ortega, Necille Van Marie P.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0003',
   'A Thesis Presented to the Faculty of the School of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Castillo, Irene P., Gales, Jenie Mhe C., Serrano, Janice N., Layno, Lyka V.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Edillor, Glenn A., Crebillo, Lenzel Marinel L., Estapia, Janica Lynn S., Cedro, Gladys Gel T.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Dela Vega, Jonathan P., Dorapan, Lea A., Japay, Maria Liza Y., Panonte, Jamila A., Regidor, Queenie Anne R.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Alisna, Shalyn, Arriesgado, Loriejane, Acevedo, Maricel, Garcia, Regine, Limetares, Greshelle',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Acierto, Wilfredo A. Jr., Guadalquiver, Emily P., Morales, Mark Dave L., Javier, Chayani S.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0008',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Delgado, Anabelle B., Manaytay, Manuel O., Maynucas, Dove L., Samontina, Carla C., Villegas, Jayson D.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0009',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Calusayan, Arlie Mae C., Doinog, Dean Ann Marie V., Lawas, Rosalina J., Matando, Christine Mae A., Talatagod, Leoniza V.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2016-0010',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Badiola, Apil-An N., Galo, Honeylie Grace V., Gayo, Cherry Mae S., Subingsubing, Jestillie M.',
   2016, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2015 ============================
  ('RS-2015-0001',
   'A Thesis Presented to the Faculty of De La Salle John Bosco College Mangagoy, Bislig City',
   'Villamor, Temoteo M. Jr., Adorable, Mary Jane P., Borromeo, Jovelyn B., Virtudazo, Meicel T., Sandao, Emie F.',
   2015, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2012 ============================
  ('RS-2012-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Arcaya, Ma. Contessa H., Lungay, Mary Rose E., Nazareno, Gabrielle Angelo M., Peligro, Joshephine T., Pitos, Arianne Joy G.',
   2012, 'Ar668u',
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2012-0002',
   'A Thesis Presented to the Faculty of the School of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Cajegas, Rosel John L., Gultian, Kharen C., Loprez, Mario P. Jr., Masangcay, Loren Mae P.',
   2012, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2012-0003',
   'A Thesis Presented to the Faculty of the School of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Badang, Jovelyn L., Carmen, Albert T., Dondoyano, Lemuel V., Mamayabay, Elygean S., Rosal, Ryll Mae T.',
   2012, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2011 ============================
  ('RS-2011-0001',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Banzon, Erwin B., Duray, Merciedes J., Catacte, Richel P., Ferrariz, Joyny C.',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2011-0002',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Bacus, Melton Roie B., Fajardo, Jerson S., Perez, Jade A., Quijano, Delmar S., Saligumba, Sheena E.',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2011-0003',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Nazareno, Aila Simele, Toraja, Merlinda, Mirasol, Marjory, Baja, Aigee, Medina, Jilly, Calusayan, Eunice, Panta, Ruth, Congreso, Irene, Villarba, Jose Antonio, Lafuente, Hanna Kaye',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2011-0004',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Banquillo, May Ann Y., Cahatian, Jevelyn V., Casipe, Gerlie B., Cervantes, Anna Cecelia R., Torrecampo, Rejin-Rex P.',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2011-0005',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Auxtero, Psymon F., Borde, Ray Dandie P., Comon, Renato C., Ferolino, Ruel Mayer D., Villagonza, Rommel M., Datoon, Gazel Kathrine Kay S., Lazarte, Paula Camille G., Santoyas, Jenesa G., Sucia, Joreza P., Tahud, Janet L.',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2011-0006',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Aliguay, Grace Ann P., Legada, Anthonet M., Linaza, Jimmy Jane E., Obedencio, Joesy C., Pahed, Glean I., Sereno, Lovely Joy V., Tadle, Fernando R. Jr., Taruc, Mary Grace M., Torejas, Andlene Ruth B., Vitor, Angelita C.',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2011-0007',
   'An Undergraduate Thesis Presented to the Faculty of the College of Business and Management De La Salle John Bosco College Mangagoy, Bislig City',
   'Alfredo, Christine C., Bacolod, Mark Vincent R., Belsondra, Ella Mie O., Betinol, Julius Philipp B., Beltran, Jerick Roy G., Paanod, Myrla S., Salgado, Robert Albien G., Samaco, Jazel D., Ronquillo, Kreyjoy O., Vallejo, Jordam V.',
   2011, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2009 ============================
  ('RS-2009-0001',
   'A Feasibility Study Presented to College of Business and Management De La Salle John Bosco College',
   'Tecson, Rena R., Marikit, Jovanie A.',
   2009, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2009-0002',
   'In Partial Fulfillment of the Requirements for the Course Entrepreneurship',
   'Cabodbod, Virgir B., Nazarono, Salty Lou M., Maisog, Quenie Chell S.',
   2009, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2009-0003',
   'A Feasibility Study Presented to College of Business and Management De La Salle John Bosco College',
   'Ando, Lorie C., Pilongo, Divina C., Delamento, Cefry Gregg G.',
   2009, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  ('RS-2009-0004',
   'A Feasibility Study Presented to College of Business and Management De La Salle John Bosco College',
   'Ordista, Mary Jane A., Marcos, Sherlyn P., Duray, Jennefel J.',
   2009, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.'),

  -- ============================ 2005 ============================
  ('RS-2005-0001',
   'A Partial Fulfillment of the Requirements of the Course Management 03: Business Development and Promotion',
   'Golosino, Marlon F., Salazar, Jomar, Quintana, Isaias Jr.',
   2005, NULL::text,
   'The source record does not provide the study title or research content needed to prepare a reliable abstract. An accurate abstract should be taken from the original thesis rather than inferred from the bibliographic record.')
), numbered AS (
  SELECT row_number() OVER () AS ord, * FROM src
)
INSERT INTO research
  (code, title, authors, adviser, program_id, year, abstract, keywords, call_number, submitted_by, status, created_at)
SELECT
  n.code,
  n.title,
  n.authors,
  NULL,
  (SELECT id FROM programs WHERE code = 'BSBA'),
  n.year,
  n.abstract,
  '',
  n.call_number,
  (SELECT id FROM users WHERE username = 'admin'),
  'approved',
  now() - (n.ord * INTERVAL '2 hours')
FROM numbered n
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Done. Verify with:
--   SELECT COUNT(*) FROM research;
--   SELECT code, title, year, call_number FROM research ORDER BY code LIMIT 20;
-- ============================================================
