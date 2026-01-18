/**
 * Base de données des pays pour GeoQuiz
 * Chaque pays a: nom, latitude, longitude, continent, difficulté, indice, code ISO
 */

const COUNTRIES = [
    // ===== EUROPE =====
    // Facile
    { name: "France", lat: 46.2276, lng: 2.2137, continent: "Europe", difficulty: "easy", hint: "Ce pays est célèbre pour la Tour Eiffel", code: "fr" },
    { name: "Allemagne", lat: 51.1657, lng: 10.4515, continent: "Europe", difficulty: "easy", hint: "Ce pays est au cœur de l'Europe", code: "de" },
    { name: "Italie", lat: 41.8719, lng: 12.5674, continent: "Europe", difficulty: "easy", hint: "Ce pays a la forme d'une botte", code: "it" },
    { name: "Espagne", lat: 40.4637, lng: -3.7492, continent: "Europe", difficulty: "easy", hint: "Ce pays est dans la péninsule ibérique", code: "es" },
    { name: "Royaume-Uni", lat: 55.3781, lng: -3.4360, continent: "Europe", difficulty: "easy", hint: "Ce pays est une île au nord-ouest de l'Europe", code: "gb" },
    { name: "Portugal", lat: 39.3999, lng: -8.2245, continent: "Europe", difficulty: "easy", hint: "Ce pays est à l'ouest de l'Espagne", code: "pt" },
    { name: "Grèce", lat: 39.0742, lng: 21.8243, continent: "Europe", difficulty: "easy", hint: "Ce pays est le berceau de la démocratie", code: "gr" },
    { name: "Suisse", lat: 46.8182, lng: 8.2275, continent: "Europe", difficulty: "easy", hint: "Ce pays est célèbre pour ses montagnes et son chocolat", code: "ch" },
    { name: "Pays-Bas", lat: 52.1326, lng: 5.2913, continent: "Europe", difficulty: "easy", hint: "Ce pays est célèbre pour ses moulins et tulipes", code: "nl" },
    { name: "Belgique", lat: 50.5039, lng: 4.4699, continent: "Europe", difficulty: "easy", hint: "Ce pays est entre la France et les Pays-Bas", code: "be" },
    
    // Moyen
    { name: "Pologne", lat: 51.9194, lng: 19.1451, continent: "Europe", difficulty: "medium", hint: "Ce pays est en Europe de l'Est", code: "pl" },
    { name: "Suède", lat: 60.1282, lng: 18.6435, continent: "Europe", difficulty: "medium", hint: "Ce pays scandinave est à l'est de la Norvège", code: "se" },
    { name: "Norvège", lat: 60.4720, lng: 8.4689, continent: "Europe", difficulty: "medium", hint: "Ce pays a des fjords célèbres", code: "no" },
    { name: "Finlande", lat: 61.9241, lng: 25.7482, continent: "Europe", difficulty: "medium", hint: "Ce pays est le pays du Père Noël", code: "fi" },
    { name: "Autriche", lat: 47.5162, lng: 14.5501, continent: "Europe", difficulty: "medium", hint: "Ce pays alpin est au sud de l'Allemagne", code: "at" },
    { name: "République Tchèque", lat: 49.8175, lng: 15.4730, continent: "Europe", difficulty: "medium", hint: "Prague est sa capitale", code: "cz" },
    { name: "Irlande", lat: 53.1424, lng: -7.6921, continent: "Europe", difficulty: "medium", hint: "L'île d'émeraude", code: "ie" },
    { name: "Danemark", lat: 56.2639, lng: 9.5018, continent: "Europe", difficulty: "medium", hint: "Ce pays scandinave est au nord de l'Allemagne", code: "dk" },
    { name: "Hongrie", lat: 47.1625, lng: 19.5033, continent: "Europe", difficulty: "medium", hint: "Budapest est sa capitale", code: "hu" },
    { name: "Roumanie", lat: 45.9432, lng: 24.9668, continent: "Europe", difficulty: "medium", hint: "Ce pays est associé à Dracula", code: "ro" },
    { name: "Ukraine", lat: 48.3794, lng: 31.1656, continent: "Europe", difficulty: "medium", hint: "Le plus grand pays entièrement en Europe", code: "ua" },
    { name: "Croatie", lat: 45.1000, lng: 15.2000, continent: "Europe", difficulty: "medium", hint: "Ce pays a une côte sur l'Adriatique", code: "hr" },
    
    // Difficile
    { name: "Slovénie", lat: 46.1512, lng: 14.9955, continent: "Europe", difficulty: "hard", hint: "Petit pays entre l'Italie et la Croatie", code: "si" },
    { name: "Slovaquie", lat: 48.6690, lng: 19.6990, continent: "Europe", difficulty: "hard", hint: "Ce pays était uni avec la Tchéquie", code: "sk" },
    { name: "Estonie", lat: 58.5953, lng: 25.0136, continent: "Europe", difficulty: "hard", hint: "Pays balte le plus au nord", code: "ee" },
    { name: "Lettonie", lat: 56.8796, lng: 24.6032, continent: "Europe", difficulty: "hard", hint: "Pays balte au milieu", code: "lv" },
    { name: "Lituanie", lat: 55.1694, lng: 23.8813, continent: "Europe", difficulty: "hard", hint: "Pays balte le plus au sud", code: "lt" },
    { name: "Albanie", lat: 41.1533, lng: 20.1683, continent: "Europe", difficulty: "hard", hint: "Ce pays est sur la côte adriatique des Balkans", code: "al" },
    { name: "Macédoine du Nord", lat: 41.5124, lng: 21.7453, continent: "Europe", difficulty: "hard", hint: "Ce pays est au nord de la Grèce", code: "mk" },
    { name: "Monténégro", lat: 42.7087, lng: 19.3744, continent: "Europe", difficulty: "hard", hint: "Petit pays sur l'Adriatique", code: "me" },
    { name: "Luxembourg", lat: 49.8153, lng: 6.1296, continent: "Europe", difficulty: "hard", hint: "Petit pays entre la France, Belgique et Allemagne", code: "lu" },
    { name: "Moldavie", lat: 47.4116, lng: 28.3699, continent: "Europe", difficulty: "hard", hint: "Ce pays est entre la Roumanie et l'Ukraine", code: "md" },
    { name: "Bosnie-Herzégovine", lat: 43.9159, lng: 17.6791, continent: "Europe", difficulty: "hard", hint: "Ce pays est dans les Balkans", code: "ba" },
    { name: "Serbie", lat: 44.0165, lng: 21.0059, continent: "Europe", difficulty: "hard", hint: "Belgrade est sa capitale", code: "rs" },
    
    // ===== ASIE =====
    // Facile
    { name: "Chine", lat: 35.8617, lng: 104.1954, continent: "Asie", difficulty: "easy", hint: "Le pays le plus peuplé du monde", code: "cn" },
    { name: "Japon", lat: 36.2048, lng: 138.2529, continent: "Asie", difficulty: "easy", hint: "Pays du soleil levant", code: "jp" },
    { name: "Inde", lat: 20.5937, lng: 78.9629, continent: "Asie", difficulty: "easy", hint: "Ce pays a le Taj Mahal", code: "in" },
    { name: "Russie", lat: 61.5240, lng: 105.3188, continent: "Asie", difficulty: "easy", hint: "Le plus grand pays du monde", code: "ru" },
    { name: "Corée du Sud", lat: 35.9078, lng: 127.7669, continent: "Asie", difficulty: "easy", hint: "Pays de Samsung et K-pop", code: "kr" },
    { name: "Thaïlande", lat: 15.8700, lng: 100.9925, continent: "Asie", difficulty: "easy", hint: "Pays des temples bouddhistes en Asie du Sud-Est", code: "th" },
    { name: "Vietnam", lat: 14.0583, lng: 108.2772, continent: "Asie", difficulty: "easy", hint: "Ce pays a la forme d'un S", code: "vn" },
    { name: "Indonésie", lat: -0.7893, lng: 113.9213, continent: "Asie", difficulty: "easy", hint: "Le plus grand archipel du monde", code: "id" },
    { name: "Turquie", lat: 38.9637, lng: 35.2433, continent: "Asie", difficulty: "easy", hint: "Ce pays est entre l'Europe et l'Asie", code: "tr" },
    
    // Moyen
    { name: "Philippines", lat: 12.8797, lng: 121.7740, continent: "Asie", difficulty: "medium", hint: "Archipel au sud-est de la Chine", code: "ph" },
    { name: "Malaisie", lat: 4.2105, lng: 101.9758, continent: "Asie", difficulty: "medium", hint: "Ce pays a les tours Petronas", code: "my" },
    { name: "Pakistan", lat: 30.3753, lng: 69.3451, continent: "Asie", difficulty: "medium", hint: "Ce pays est à l'ouest de l'Inde", code: "pk" },
    { name: "Bangladesh", lat: 23.6850, lng: 90.3563, continent: "Asie", difficulty: "medium", hint: "Ce pays est entouré par l'Inde", code: "bd" },
    { name: "Iran", lat: 32.4279, lng: 53.6880, continent: "Asie", difficulty: "medium", hint: "Anciennement appelé Perse", code: "ir" },
    { name: "Irak", lat: 33.2232, lng: 43.6793, continent: "Asie", difficulty: "medium", hint: "Pays de la Mésopotamie", code: "iq" },
    { name: "Arabie Saoudite", lat: 23.8859, lng: 45.0792, continent: "Asie", difficulty: "medium", hint: "Plus grand pays de la péninsule arabique", code: "sa" },
    { name: "Kazakhstan", lat: 48.0196, lng: 66.9237, continent: "Asie", difficulty: "medium", hint: "Plus grand pays d'Asie centrale", code: "kz" },
    { name: "Myanmar", lat: 21.9162, lng: 95.9560, continent: "Asie", difficulty: "medium", hint: "Anciennement appelé Birmanie", code: "mm" },
    { name: "Népal", lat: 28.3949, lng: 84.1240, continent: "Asie", difficulty: "medium", hint: "Pays de l'Everest", code: "np" },
    { name: "Cambodge", lat: 12.5657, lng: 104.9910, continent: "Asie", difficulty: "medium", hint: "Pays d'Angkor Wat", code: "kh" },
    { name: "Sri Lanka", lat: 7.8731, lng: 80.7718, continent: "Asie", difficulty: "medium", hint: "Île au sud de l'Inde", code: "lk" },
    
    // Difficile
    { name: "Ouzbékistan", lat: 41.3775, lng: 64.5853, continent: "Asie", difficulty: "hard", hint: "Pays d'Asie centrale sur la route de la soie", code: "uz" },
    { name: "Turkménistan", lat: 38.9697, lng: 59.5563, continent: "Asie", difficulty: "hard", hint: "Pays d'Asie centrale bordant la mer Caspienne", code: "tm" },
    { name: "Tadjikistan", lat: 38.8610, lng: 71.2761, continent: "Asie", difficulty: "hard", hint: "Petit pays montagneux d'Asie centrale", code: "tj" },
    { name: "Kirghizistan", lat: 41.2044, lng: 74.7661, continent: "Asie", difficulty: "hard", hint: "Pays montagneux d'Asie centrale", code: "kg" },
    { name: "Laos", lat: 19.8563, lng: 102.4955, continent: "Asie", difficulty: "hard", hint: "Pays enclavé en Asie du Sud-Est", code: "la" },
    { name: "Mongolie", lat: 46.8625, lng: 103.8467, continent: "Asie", difficulty: "hard", hint: "Pays entre la Russie et la Chine", code: "mn" },
    { name: "Bhoutan", lat: 27.5142, lng: 90.4336, continent: "Asie", difficulty: "hard", hint: "Petit royaume dans l'Himalaya", code: "bt" },
    { name: "Azerbaïdjan", lat: 40.1431, lng: 47.5769, continent: "Asie", difficulty: "hard", hint: "Pays sur la mer Caspienne", code: "az" },
    { name: "Géorgie", lat: 42.3154, lng: 43.3569, continent: "Asie", difficulty: "hard", hint: "Pays du Caucase sur la mer Noire", code: "ge" },
    { name: "Arménie", lat: 40.0691, lng: 45.0382, continent: "Asie", difficulty: "hard", hint: "Petit pays du Caucase", code: "am" },
    { name: "Jordanie", lat: 30.5852, lng: 36.2384, continent: "Asie", difficulty: "hard", hint: "Pays avec la cité de Petra", code: "jo" },
    { name: "Liban", lat: 33.8547, lng: 35.8623, continent: "Asie", difficulty: "hard", hint: "Petit pays méditerranéen au Moyen-Orient", code: "lb" },
    { name: "Koweït", lat: 29.3117, lng: 47.4818, continent: "Asie", difficulty: "hard", hint: "Petit pays riche en pétrole dans le Golfe", code: "kw" },
    { name: "Oman", lat: 21.4735, lng: 55.9754, continent: "Asie", difficulty: "hard", hint: "Sultanat dans la péninsule arabique", code: "om" },
    { name: "Yémen", lat: 15.5527, lng: 48.5164, continent: "Asie", difficulty: "hard", hint: "Pays au sud de la péninsule arabique", code: "ye" },
    { name: "Afghanistan", lat: 33.9391, lng: 67.7100, continent: "Asie", difficulty: "hard", hint: "Pays montagneux d'Asie centrale", code: "af" },
    
    // ===== AFRIQUE =====
    // Facile
    { name: "Égypte", lat: 26.8206, lng: 30.8025, continent: "Afrique", difficulty: "easy", hint: "Pays des pyramides", code: "eg" },
    { name: "Maroc", lat: 31.7917, lng: -7.0926, continent: "Afrique", difficulty: "easy", hint: "Ce pays est au nord-ouest de l'Afrique", code: "ma" },
    { name: "Afrique du Sud", lat: -30.5595, lng: 22.9375, continent: "Afrique", difficulty: "easy", hint: "Pays à la pointe sud de l'Afrique", code: "za" },
    { name: "Kenya", lat: -0.0236, lng: 37.9062, continent: "Afrique", difficulty: "easy", hint: "Pays célèbre pour ses safaris", code: "ke" },
    { name: "Nigeria", lat: 9.0820, lng: 8.6753, continent: "Afrique", difficulty: "easy", hint: "Pays le plus peuplé d'Afrique", code: "ng" },
    { name: "Algérie", lat: 28.0339, lng: 1.6596, continent: "Afrique", difficulty: "easy", hint: "Plus grand pays d'Afrique", code: "dz" },
    { name: "Tunisie", lat: 33.8869, lng: 9.5375, continent: "Afrique", difficulty: "easy", hint: "Petit pays au nord de l'Afrique", code: "tn" },
    
    // Moyen
    { name: "Éthiopie", lat: 9.1450, lng: 40.4897, continent: "Afrique", difficulty: "medium", hint: "Pays de la corne de l'Afrique", code: "et" },
    { name: "Ghana", lat: 7.9465, lng: -1.0232, continent: "Afrique", difficulty: "medium", hint: "Pays d'Afrique de l'Ouest sur le golfe de Guinée", code: "gh" },
    { name: "Tanzanie", lat: -6.3690, lng: 34.8888, continent: "Afrique", difficulty: "medium", hint: "Pays du Kilimandjaro", code: "tz" },
    { name: "Côte d'Ivoire", lat: 7.5400, lng: -5.5471, continent: "Afrique", difficulty: "medium", hint: "Pays francophone d'Afrique de l'Ouest", code: "ci" },
    { name: "Sénégal", lat: 14.4974, lng: -14.4524, continent: "Afrique", difficulty: "medium", hint: "Pays le plus à l'ouest de l'Afrique continentale", code: "sn" },
    { name: "Cameroun", lat: 7.3697, lng: 12.3547, continent: "Afrique", difficulty: "medium", hint: "Pays d'Afrique centrale", code: "cm" },
    { name: "Madagascar", lat: -18.7669, lng: 46.8691, continent: "Afrique", difficulty: "medium", hint: "Grande île à l'est de l'Afrique", code: "mg" },
    { name: "Ouganda", lat: 1.3733, lng: 32.2903, continent: "Afrique", difficulty: "medium", hint: "Pays d'Afrique de l'Est", code: "ug" },
    { name: "République Démocratique du Congo", lat: -4.0383, lng: 21.7587, continent: "Afrique", difficulty: "medium", hint: "Deuxième plus grand pays d'Afrique", code: "cd" },
    { name: "Mozambique", lat: -18.6657, lng: 35.5296, continent: "Afrique", difficulty: "medium", hint: "Pays d'Afrique australe sur l'océan Indien", code: "mz" },
    { name: "Zimbabwe", lat: -19.0154, lng: 29.1549, continent: "Afrique", difficulty: "medium", hint: "Pays des chutes Victoria", code: "zw" },
    { name: "Angola", lat: -11.2027, lng: 17.8739, continent: "Afrique", difficulty: "medium", hint: "Grand pays d'Afrique australe", code: "ao" },
    
    // Difficile
    { name: "Burkina Faso", lat: 12.2383, lng: -1.5616, continent: "Afrique", difficulty: "hard", hint: "Pays enclavé d'Afrique de l'Ouest", code: "bf" },
    { name: "Mali", lat: 17.5707, lng: -3.9962, continent: "Afrique", difficulty: "hard", hint: "Grand pays sahélien", code: "ml" },
    { name: "Niger", lat: 17.6078, lng: 8.0817, continent: "Afrique", difficulty: "hard", hint: "Pays du Sahara", code: "ne" },
    { name: "Tchad", lat: 15.4542, lng: 18.7322, continent: "Afrique", difficulty: "hard", hint: "Pays d'Afrique centrale", code: "td" },
    { name: "Soudan", lat: 12.8628, lng: 30.2176, continent: "Afrique", difficulty: "hard", hint: "Grand pays au sud de l'Égypte", code: "sd" },
    { name: "Libye", lat: 26.3351, lng: 17.2283, continent: "Afrique", difficulty: "hard", hint: "Pays entre l'Égypte et la Tunisie", code: "ly" },
    { name: "Mauritanie", lat: 21.0079, lng: -10.9408, continent: "Afrique", difficulty: "hard", hint: "Pays saharien d'Afrique de l'Ouest", code: "mr" },
    { name: "Namibie", lat: -22.9576, lng: 18.4904, continent: "Afrique", difficulty: "hard", hint: "Pays avec le désert du Namib", code: "na" },
    { name: "Botswana", lat: -22.3285, lng: 24.6849, continent: "Afrique", difficulty: "hard", hint: "Pays du delta de l'Okavango", code: "bw" },
    { name: "Zambie", lat: -13.1339, lng: 27.8493, continent: "Afrique", difficulty: "hard", hint: "Pays d'Afrique australe", code: "zm" },
    { name: "Malawi", lat: -13.2543, lng: 34.3015, continent: "Afrique", difficulty: "hard", hint: "Petit pays avec un grand lac", code: "mw" },
    { name: "Rwanda", lat: -1.9403, lng: 29.8739, continent: "Afrique", difficulty: "hard", hint: "Pays des mille collines", code: "rw" },
    { name: "Bénin", lat: 9.3077, lng: 2.3158, continent: "Afrique", difficulty: "hard", hint: "Petit pays d'Afrique de l'Ouest", code: "bj" },
    { name: "Togo", lat: 8.6195, lng: 0.8248, continent: "Afrique", difficulty: "hard", hint: "Petit pays entre le Ghana et le Bénin", code: "tg" },
    { name: "Gabon", lat: -0.8037, lng: 11.6094, continent: "Afrique", difficulty: "hard", hint: "Pays équatorial d'Afrique centrale", code: "ga" },
    { name: "Congo", lat: -0.2280, lng: 15.8277, continent: "Afrique", difficulty: "hard", hint: "République du Congo", code: "cg" },
    { name: "Centrafrique", lat: 6.6111, lng: 20.9394, continent: "Afrique", difficulty: "hard", hint: "Pays au centre de l'Afrique", code: "cf" },
    { name: "Érythrée", lat: 15.1794, lng: 39.7823, continent: "Afrique", difficulty: "hard", hint: "Pays sur la mer Rouge", code: "er" },
    { name: "Somalie", lat: 5.1521, lng: 46.1996, continent: "Afrique", difficulty: "hard", hint: "Pays de la corne de l'Afrique", code: "so" },
    { name: "Djibouti", lat: 11.8251, lng: 42.5903, continent: "Afrique", difficulty: "hard", hint: "Petit pays stratégique de la corne de l'Afrique", code: "dj" },
    
    // ===== AMÉRIQUE DU NORD =====
    // Facile
    { name: "États-Unis", lat: 37.0902, lng: -95.7129, continent: "Amérique du Nord", difficulty: "easy", hint: "Le pays de la Statue de la Liberté", code: "us" },
    { name: "Canada", lat: 56.1304, lng: -106.3468, continent: "Amérique du Nord", difficulty: "easy", hint: "Deuxième plus grand pays du monde", code: "ca" },
    { name: "Mexique", lat: 23.6345, lng: -102.5528, continent: "Amérique du Nord", difficulty: "easy", hint: "Pays au sud des États-Unis", code: "mx" },
    { name: "Cuba", lat: 21.5218, lng: -77.7812, continent: "Amérique du Nord", difficulty: "easy", hint: "Grande île des Caraïbes", code: "cu" },
    
    // Moyen
    { name: "Guatemala", lat: 15.7835, lng: -90.2308, continent: "Amérique du Nord", difficulty: "medium", hint: "Pays d'Amérique centrale avec des ruines mayas", code: "gt" },
    { name: "Honduras", lat: 15.2000, lng: -86.2419, continent: "Amérique du Nord", difficulty: "medium", hint: "Pays d'Amérique centrale", code: "hn" },
    { name: "Nicaragua", lat: 12.8654, lng: -85.2072, continent: "Amérique du Nord", difficulty: "medium", hint: "Plus grand pays d'Amérique centrale", code: "ni" },
    { name: "Costa Rica", lat: 9.7489, lng: -83.7534, continent: "Amérique du Nord", difficulty: "medium", hint: "Pays sans armée d'Amérique centrale", code: "cr" },
    { name: "Panama", lat: 8.5380, lng: -80.7821, continent: "Amérique du Nord", difficulty: "medium", hint: "Pays du célèbre canal", code: "pa" },
    { name: "Jamaïque", lat: 18.1096, lng: -77.2975, continent: "Amérique du Nord", difficulty: "medium", hint: "Île des Caraïbes, patrie du reggae", code: "jm" },
    { name: "Haïti", lat: 18.9712, lng: -72.2852, continent: "Amérique du Nord", difficulty: "medium", hint: "Pays partageant l'île d'Hispaniola", code: "ht" },
    { name: "République Dominicaine", lat: 18.7357, lng: -70.1627, continent: "Amérique du Nord", difficulty: "medium", hint: "Pays à l'est d'Haïti", code: "do" },
    
    // Difficile
    { name: "Belize", lat: 17.1899, lng: -88.4976, continent: "Amérique du Nord", difficulty: "hard", hint: "Seul pays anglophone d'Amérique centrale", code: "bz" },
    { name: "El Salvador", lat: 13.7942, lng: -88.8965, continent: "Amérique du Nord", difficulty: "hard", hint: "Plus petit pays d'Amérique centrale", code: "sv" },
    { name: "Trinité-et-Tobago", lat: 10.6918, lng: -61.2225, continent: "Amérique du Nord", difficulty: "hard", hint: "Îles au nord du Venezuela", code: "tt" },
    { name: "Bahamas", lat: 25.0343, lng: -77.3963, continent: "Amérique du Nord", difficulty: "hard", hint: "Archipel au nord de Cuba", code: "bs" },
    
    // ===== AMÉRIQUE DU SUD =====
    // Facile
    { name: "Brésil", lat: -14.2350, lng: -51.9253, continent: "Amérique du Sud", difficulty: "easy", hint: "Plus grand pays d'Amérique du Sud", code: "br" },
    { name: "Argentine", lat: -38.4161, lng: -63.6167, continent: "Amérique du Sud", difficulty: "easy", hint: "Pays du tango et de la Patagonie", code: "ar" },
    { name: "Chili", lat: -35.6751, lng: -71.5430, continent: "Amérique du Sud", difficulty: "easy", hint: "Pays le plus long du monde", code: "cl" },
    { name: "Pérou", lat: -9.1900, lng: -75.0152, continent: "Amérique du Sud", difficulty: "easy", hint: "Pays du Machu Picchu", code: "pe" },
    { name: "Colombie", lat: 4.5709, lng: -74.2973, continent: "Amérique du Sud", difficulty: "easy", hint: "Pays au nord de l'Amérique du Sud", code: "co" },
    
    // Moyen
    { name: "Venezuela", lat: 6.4238, lng: -66.5897, continent: "Amérique du Sud", difficulty: "medium", hint: "Pays avec les chutes Angel", code: "ve" },
    { name: "Équateur", lat: -1.8312, lng: -78.1834, continent: "Amérique du Sud", difficulty: "medium", hint: "Pays traversé par la ligne équatoriale", code: "ec" },
    { name: "Bolivie", lat: -16.2902, lng: -63.5887, continent: "Amérique du Sud", difficulty: "medium", hint: "Pays enclavé avec le lac Titicaca", code: "bo" },
    { name: "Paraguay", lat: -23.4425, lng: -58.4438, continent: "Amérique du Sud", difficulty: "medium", hint: "Pays enclavé d'Amérique du Sud", code: "py" },
    { name: "Uruguay", lat: -32.5228, lng: -55.7658, continent: "Amérique du Sud", difficulty: "medium", hint: "Petit pays entre le Brésil et l'Argentine", code: "uy" },
    
    // Difficile
    { name: "Guyana", lat: 4.8604, lng: -58.9302, continent: "Amérique du Sud", difficulty: "hard", hint: "Pays anglophone d'Amérique du Sud", code: "gy" },
    { name: "Suriname", lat: 3.9193, lng: -56.0278, continent: "Amérique du Sud", difficulty: "hard", hint: "Ancien territoire néerlandais en Amérique du Sud", code: "sr" },
    
    // ===== OCÉANIE =====
    // Facile
    { name: "Australie", lat: -25.2744, lng: 133.7751, continent: "Océanie", difficulty: "easy", hint: "Pays-continent avec des kangourous", code: "au" },
    { name: "Nouvelle-Zélande", lat: -40.9006, lng: 174.8860, continent: "Océanie", difficulty: "easy", hint: "Pays au sud-est de l'Australie", code: "nz" },
    
    // Moyen
    { name: "Fidji", lat: -17.7134, lng: 178.0650, continent: "Océanie", difficulty: "medium", hint: "Archipel du Pacifique Sud", code: "fj" },
    { name: "Papouasie-Nouvelle-Guinée", lat: -6.3150, lng: 143.9555, continent: "Océanie", difficulty: "medium", hint: "Grande île au nord de l'Australie", code: "pg" },
    
    // Difficile
    { name: "Vanuatu", lat: -15.3767, lng: 166.9592, continent: "Océanie", difficulty: "hard", hint: "Archipel du Pacifique Sud", code: "vu" },
    { name: "Îles Salomon", lat: -9.6457, lng: 160.1562, continent: "Océanie", difficulty: "hard", hint: "Archipel au nord-est de l'Australie", code: "sb" },
    { name: "Samoa", lat: -13.7590, lng: -172.1046, continent: "Océanie", difficulty: "hard", hint: "Îles polynésiennes", code: "ws" },
    { name: "Tonga", lat: -21.1790, lng: -175.1982, continent: "Océanie", difficulty: "hard", hint: "Royaume polynésien", code: "to" },
    { name: "Micronésie", lat: 7.4256, lng: 150.5508, continent: "Océanie", difficulty: "hard", hint: "Îles du Pacifique occidental", code: "fm" },
    { name: "Palaos", lat: 7.5150, lng: 134.5825, continent: "Océanie", difficulty: "hard", hint: "Petit archipel du Pacifique occidental", code: "pw" },
    { name: "Kiribati", lat: 1.8369, lng: -157.3768, continent: "Océanie", difficulty: "hard", hint: "Îles sur l'équateur dans le Pacifique", code: "ki" },
    { name: "Nauru", lat: -0.5228, lng: 166.9315, continent: "Océanie", difficulty: "hard", hint: "Plus petite république du monde", code: "nr" },
    { name: "Tuvalu", lat: -7.1095, lng: 177.6493, continent: "Océanie", difficulty: "hard", hint: "Un des plus petits pays du monde", code: "tv" }
];

// Compatibilité Node.js et navigateur
if (typeof module !== 'undefined' && module.exports) {
    module.exports = COUNTRIES;
}

if (typeof window !== 'undefined') {
    window.COUNTRIES = COUNTRIES;
}
