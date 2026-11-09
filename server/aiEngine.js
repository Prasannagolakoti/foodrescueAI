// AI-Powered Smart Food Rescue Engine
// Handles: Haversine distance, Multi-factor Smart Matching, Food Safety Verification, and Bilingual Chatbot

/**
 * Calculates Great Circle distance between two lat/lng coordinates in kilometers using Haversine formula
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 5.0; // Default reasonable urban radius fallback
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * AI Food Safety Verification
 * Evaluates food category, preparation time, safe deadline, storage condition, and environmental risk factors.
 */
function verifyFoodSafety({ category, food_type, prep_time, safe_deadline, storage_condition }) {
  const now = new Date();
  const prepDate = new Date(prep_time);
  const deadlineDate = new Date(safe_deadline);

  const hoursSincePrep = (now.getTime() - prepDate.getTime()) / (1000 * 3600);
  const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 3600);

  let status = 'Safe to Consider';
  let score = 95;
  const warnings = [];
  const guidelines = [];

  // 1. Critical Deadline Check
  if (hoursUntilDeadline <= 0) {
    return {
      status: 'Expired / Unsafe',
      score: 0,
      hoursUntilDeadline: 0,
      hoursSincePrep: Math.max(0, Math.round(hoursSincePrep * 10) / 10),
      warnings: ['Safe consumption deadline has passed. This food cannot be distributed.'],
      recommendation: 'Food is expired. Do not distribute. Discard safely or route to composting.',
      allowRequest: false
    };
  }

  // 2. Storage Condition & Category Risk Evaluation
  if (category === 'Cooked Meals') {
    if (storage_condition === 'Ambient / Room Temp') {
      if (hoursSincePrep > 4) {
        status = 'Expired / Unsafe';
        score = 25;
        warnings.push('Cooked meals left at room temperature for over 4 hours enter the high-risk bacterial danger zone (5°C - 60°C).');
      } else if (hoursSincePrep > 2) {
        status = 'Needs Verification';
        score = 65;
        warnings.push('Cooked food at room temperature nearing the 4-hour safety threshold. Requires immediate thermal dispatch.');
      }
    } else if (storage_condition === 'Hot Held (>60°C)') {
      guidelines.push('Maintained above 60°C in food-grade thermoware; low risk of bacterial proliferation.');
      score = Math.min(100, score + 3);
    } else if (storage_condition === 'Refrigerated (0-4°C)') {
      guidelines.push('Rapidly chilled; preserves nutrient integrity for up to 24-48 hours.');
      score = Math.min(100, score + 4);
    }
  }

  // 3. Non-veg extra safety check
  if (food_type === 'non-veg') {
    if (storage_condition === 'Ambient / Room Temp' && hoursSincePrep > 2) {
      status = 'Needs Verification';
      score = Math.min(score, 60);
      warnings.push('Non-vegetarian food is highly perishable at ambient temperatures. Physical sensory verification required.');
    }
  }

  // 4. Dairy & Sweets check
  if (category === 'Dairy & Sweets') {
    if (storage_condition !== 'Refrigerated (0-4°C)' && storage_condition !== 'Frozen (<-18°C)') {
      status = 'Needs Verification';
      score = Math.min(score, 70);
      warnings.push('Dairy items must be continuously refrigerated under 4°C to prevent lactic acidification and curdling.');
    }
  }

  // 5. Imminent deadline warning
  if (hoursUntilDeadline < 2 && status === 'Safe to Consider') {
    warnings.push('Approaching expiry within 2 hours. Requires express priority pickup!');
    score = Math.max(75, score - 10);
  }

  let recommendation = '';
  if (status === 'Safe to Consider') {
    recommendation = `Food parameters meet public health safety standards. Safe for immediate collection and redistribution within ${Math.max(1, Math.round(hoursUntilDeadline))} hours.`;
  } else if (status === 'Needs Verification') {
    recommendation = 'Food requires physical visual/odor verification by NGO food safety coordinator prior to distribution.';
  } else {
    recommendation = 'Unsafe for human consumption due to temperature or elapsed time limits. Reject donation.';
  }

  return {
    status,
    score: Math.max(0, Math.min(100, Math.round(score))),
    hoursUntilDeadline: Math.round(hoursUntilDeadline * 10) / 10,
    hoursSincePrep: Math.max(0, Math.round(hoursSincePrep * 10) / 10),
    warnings,
    guidelines,
    recommendation,
    allowRequest: status !== 'Expired / Unsafe'
  };
}

/**
 * AI Smart Matching Algorithm
 * Automatically compares donor's available food with recipient's food requirements based on 6 core factors:
 * 1. Food Name & Keywords
 * 2. Food Category
 * 3. Quantity (Available quantity vs Recipient required quantity)
 * 4. Availability (Status must be 'Available')
 * 5. Expiry Time (Safe deadline vs current time)
 * 6. Location (Real distance between donor and recipient coordinates from database)
 */
function calculateSmartMatch({
  donation,
  receiver,
  distanceKm,
  requiredFoodName,
  requiredCategory,
  requiredQuantity,
  requiredPickupTime
}) {
  const now = new Date();
  const deadline = new Date(donation.safe_deadline);
  const hoursRemaining = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 3600));

  // 1. Availability Check (Status must be 'Available' and not expired)
  let availabilityScore = 100;
  if (donation.status !== 'Available') {
    availabilityScore = 0;
  }

  // 2. Expiry Time Factor
  let expiryScore = 100;
  if (hoursRemaining <= 0) {
    expiryScore = 0; // Expired
  } else if (hoursRemaining < 2) {
    expiryScore = distanceKm != null && distanceKm <= 5 ? 100 : 70; // Urgent priority for close pickup
  } else if (hoursRemaining <= 24) {
    expiryScore = 95; // Fresh with comfortable consumption window
  } else {
    expiryScore = 90;
  }

  // If food is unavailable or expired, total match is 0
  if (availabilityScore === 0 || expiryScore === 0) {
    return {
      matchPercentage: 0,
      distanceKm,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      recommendationReason: 'Food is expired or no longer available for redistribution.',
      breakdown: {
        foodNameScore: 0,
        categoryScore: 0,
        quantityScore: 0,
        availabilityScore: 0,
        expiryScore: 0,
        locationScore: 0
      }
    };
  }

  // 3. Food Name & Description Keyword Match
  let nameScore = 95; // Default if no specific name requested
  if (requiredFoodName && requiredFoodName.trim()) {
    const searchTerms = requiredFoodName.toLowerCase().trim().split(/\s+/);
    const donationText = `${donation.food_name || ''} ${donation.description || ''}`.toLowerCase();
    
    let matchedCount = 0;
    for (const term of searchTerms) {
      if (donationText.includes(term)) matchedCount++;
    }

    if (matchedCount === searchTerms.length) {
      nameScore = 100; // Complete keyword match
    } else if (matchedCount > 0) {
      nameScore = 60; // Partial match
    } else {
      nameScore = 0; // Dish does not match requirement
    }
  }

  // 4. Food Category Match
  let categoryScore = 95;
  if (requiredCategory && requiredCategory !== 'All' && requiredCategory.trim()) {
    if (donation.category && donation.category.toLowerCase() === requiredCategory.toLowerCase()) {
      categoryScore = 100;
    } else {
      categoryScore = 0; // Category mismatch
    }
  }

  // 5. Quantity vs Required Quantity Match
  const availableKg = parseFloat(donation.quantity) || 1;
  const targetDemandKg = (requiredQuantity != null && requiredQuantity > 0)
    ? parseFloat(requiredQuantity)
    : (receiver.beneficiaries ? receiver.beneficiaries / 2.5 : availableKg);

  const quantityRatio = availableKg / Math.max(1, targetDemandKg);
  let quantityScore = 85;
  if (quantityRatio >= 0.75 && quantityRatio <= 1.4) {
    quantityScore = 100; // Perfect portion match
  } else if (quantityRatio > 1.4 && quantityRatio <= 2.5) {
    quantityScore = 90; // Ample surplus
  } else if (quantityRatio >= 0.4 && quantityRatio < 0.75) {
    quantityScore = 75; // Partial portion supplement
  } else {
    quantityScore = 55;
  }

  // 6. Location Proximity Score
  let locationScore = 60;
  if (distanceKm != null) {
    if (distanceKm <= 3) {
      locationScore = 100;
    } else if (distanceKm <= 7) {
      locationScore = 90;
    } else if (distanceKm <= 15) {
      locationScore = 75;
    } else if (distanceKm <= 30) {
      locationScore = 60;
    } else {
      locationScore = Math.max(20, 50 - (distanceKm - 30) * 1.5);
    }
  } else {
    locationScore = 50; // Coordinates missing in DB
  }

  // Compute Weighted Composite Match Score
  // Weights: Location (20%), Quantity (20%), Food Name (15%), Category (15%), Expiry (15%), Availability (15%)
  let totalMatchScore =
    locationScore * 0.20 +
    quantityScore * 0.20 +
    nameScore * 0.15 +
    categoryScore * 0.15 +
    expiryScore * 0.15 +
    availabilityScore * 0.15;

  totalMatchScore = Math.max(10, Math.min(99, Math.round(totalMatchScore)));

  // Generate explainable recommendation rationale
  const reasons = [];
  if (requiredFoodName && requiredFoodName.trim()) {
    if (nameScore === 100) {
      reasons.push(`"${donation.food_name}" matches requested food requirement.`);
    } else if (nameScore > 0) {
      reasons.push(`"${donation.food_name}" partially aligns with searched keywords.`);
    }
  } else if (nameScore >= 95) {
    reasons.push(`"${donation.food_name}" is suitable for donation.`);
  }

  if (requiredCategory && requiredCategory !== 'All' && requiredCategory.trim()) {
    if (categoryScore === 100) {
      reasons.push(`${donation.category} category matches required criteria.`);
    }
  } else if (categoryScore >= 95) {
    reasons.push(`${donation.category} category.`);
  }

  if (quantityRatio >= 0.75 && quantityRatio <= 1.4) {
    reasons.push(`Portion alignment: ${availableKg} ${donation.quantity_unit || 'kg'} (~${donation.packets_count || Math.round(availableKg * 2.5)} servings) matches required quantity.`);
  } else if (quantityRatio > 1.4) {
    reasons.push(`Generous surplus: ~${donation.packets_count || Math.round(availableKg * 2.5)} servings available.`);
  } else {
    reasons.push(`Provides a wholesome supplement of ${availableKg} ${donation.quantity_unit || 'kg'}.`);
  }

  if (distanceKm != null) {
    if (distanceKm <= 3) {
      reasons.push(`Close proximity (${distanceKm} km away), ensuring fast pickup.`);
    } else {
      reasons.push(`Located ${distanceKm} km away.`);
    }
  } else {
    reasons.push('Location coordinates need verification in database.');
  }

  if (hoursRemaining > 0 && hoursRemaining < 3) {
    reasons.push(`Urgent pickup: ${Math.round(hoursRemaining * 10) / 10} hours left before safe deadline.`);
  } else {
    reasons.push(`Safe consumption window: ${Math.round(hoursRemaining * 10) / 10} hours remaining.`);
  }

  return {
    matchPercentage: totalMatchScore,
    distanceKm,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    recommendationReason: reasons.join(' '),
    breakdown: {
      foodNameScore: Math.round(nameScore),
      categoryScore: Math.round(categoryScore),
      quantityScore: Math.round(quantityScore),
      availabilityScore: Math.round(availabilityScore),
      expiryScore: Math.round(expiryScore),
      locationScore: Math.round(locationScore)
    }
  };
}

/**
 * AI Food Rescue Chatbot NLP Engine
 * Supports fluent English and Telugu answers with intelligent contextual intent matching.
 */
function handleAIChatbotQuery({ message, language = 'en', user = null }) {
  const query = (message || '').trim().toLowerCase();
  const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(message);

  // Intent classification
  if (query.includes('donate') || query.includes('how to donate') || query.includes('దానం') || query.includes('ఇవ్వడం')) {
    if (isTelugu) {
      return {
        reply: `ఆహారాన్ని దానం చేయడం చాలా సులభం!\n\n1. "Donate Food" (ఆహారం దానం చేయండి) పేజీకి వెళ్లండి.\n2. ఆహార పేరు, పరిమాణం (కేజీలు/ప్లేట్లు), మరియు శాకాహార/మాంసాహార వివరాలు నమోదు చేయండి.\n3. ఆహారం తయారుచేసిన సమయం మరియు గడువు సమయాన్ని ఎంచుకోండి.\n4. AI భద్రతా తనిఖీ మీ ఆహారాన్ని పరిశీలించి "Safe to Consider" గా ధృవీకరిస్తుంది.\n5. సమీపంలోని అనాథాశ్రమాలు లేదా NGOలకు AI తక్షణమే సమాచారం పంపుతుంది!`,
        suggestions: [
          'ఆహారం భద్రత నియమాలు ఏమిటి?',
          'సమీపంలో ఉన్న NGOలను ఎలా చూడాలి?',
          'నా విరాళం స్థితిని ఎలా ట్రాక్ చేయాలి?'
        ]
      };
    }
    return {
      reply: `Donating surplus food is simple, fast, and safe on our platform!\n\n1. Click **Donate Food** on the navigation bar.\n2. Enter the food name, quantity (in kg or packets), and choose Veg or Non-Veg.\n3. Provide the preparation time, storage condition (e.g. Hot Held or Refrigerated), and safe consumption deadline.\n4. Our AI Food Safety Engine instantly evaluates safety compliance.\n5. Once posted, our AI Smart Matching Engine instantly alerts suitable nearby orphanages and shelters!`,
      suggestions: [
        'How does AI smart matching work?',
        'What are the food safety guidelines?',
        'How do I track my active donations?'
      ]
    };
  }

  if (query.includes('find') || query.includes('available') || query.includes('search') || query.includes('ఆహారం ఎక్కడ') || query.includes('లభిస్తుంది')) {
    if (isTelugu) {
      return {
        reply: `ప్రస్తుతం అందుబాటులో ఉన్న ఆహారాన్ని చూడటానికి:\n\n1. "Available Food" పేజీని సందర్శించండి లేదా "Map View" మ్యాప్ చూడండి.\n2. లొకేషన్, శాకాహారం/మాంసాహారం, మరియు కేటగిరీల ప్రకారం ఫిల్టర్ చేయండి.\n3. ప్రతి ఫుడ్ కార్డ్‌పై తయారీ సమయం, సురక్షిత గడువు మరియు లొకేషన్ స్పష్టంగా కనిపిస్తాయి.\n4. మీకు సరిపోయే ఆహారాన్ని ఎంచుకుని "Request Food" బటన్ నొక్కండి!`,
        suggestions: [
          'స్వచ్ఛంద సంస్థలు ఎలా నమోదు చేసుకోవాలి?',
          'ఆహారం కోసం ఎలా అభ్యర్థించాలి?',
          'AI స్మార్ట్ మ్యాచింగ్ ఎలా పనిచేస్తుంది?'
        ]
      };
    }
    return {
      reply: `You can discover fresh available surplus food in real time:\n\n1. Visit the **Available Food** catalog or the interactive **Map View**.\n2. Filter by Veg/Non-Veg, category (Cooked Meals, Bakery, Produce), and distance.\n3. Each listing shows real-time freshness scores, safe deadlines, donor details, and pickup addresses.\n4. Click **Request Food** to specify required plates and beneficiary count!`,
      suggestions: [
        'How do I request food?',
        'Can I view listings on a map?',
        'How does food verification work?'
      ]
    };
  }

  if (query.includes('request') || query.includes('అభ్యర్థన') || query.includes('రిక్వెస్ట్') || query.includes('అడగడం')) {
    if (isTelugu) {
      return {
        reply: `ఆహారాన్ని అభ్యర్థించడానికి:\n\n1. రిసీవర్/NGO ఖాతాతో లాగిన్ అవ్వండి.\n2. అందుబాటులో ఉన్న ఆహారంపై "Request Food" బటన్ నొక్కండి.\n3. లబ్ధిదారుల సంఖ్య (Beneficiaries) మరియు అవసరమైన పరిమాణాన్ని నమోదు చేయండి.\n4. పికప్ సమయం మరియు ఏవైనా ప్రత్యేక అవసరాలు పేర్కొనండి.\n5. దాత ఆమోదించిన వెంటనే "Accepted" మరియు "Ready for Pickup" నోటిఫికేషన్ వస్తుంది!`,
        suggestions: [
          'ఆర్డర్ స్థితిని ఎలా తనిఖీ చేయాలి?',
          'ఎక్స్‌పైరీ హెచ్చరికలు ఎలా పనిచేస్తాయి?',
          'రేటింగ్ ఎలా ఇవ్వాలి?'
        ]
      };
    }
    return {
      reply: `To request surplus food as an NGO, Shelter, or Orphanage:\n\n1. Sign in with your **Receiver** account.\n2. Find any active listing on the **Available Food** or **Smart Matching** page.\n3. Click **Request Food** and specify required packets/kg and beneficiary count.\n4. Add any transport details (e.g. volunteer van arrival time).\n5. Once accepted by the donor, you will be notified to proceed with pickup!`,
      suggestions: [
        'How can NGOs register?',
        'How do donors accept requests?',
        'What happens when food is ready for pickup?'
      ]
    };
  }

  if (query.includes('matching') || query.includes('smart match') || query.includes('మ్యాచింగ్') || query.includes('ఆటోమేటిక్')) {
    if (isTelugu) {
      return {
        reply: `మా AI స్మార్ట్ మ్యాచింగ్ సిస్టమ్ కింది ముఖ్య అంశాల ఆధారంగా ఆహారాన్ని సరైన గ్రహీతలతో జత చేస్తుంది:\n\n- **దూరం (Distance):** తక్కువ దూరం ఉన్న అనాథాశ్రమాలకు మొదటి ప్రాధాన్యత.\n- **పరిమాణం (Quantity Match):** దానం చేసిన భోజనం మరియు ఆశ్రమంలోని పిల్లలు/ప్రజల సంఖ్య సరిపోలిక.\n- **భద్రత & గడువు సమయం (Shelf-life Urgency):** గడువు త్వరగా ముగిసే ఆహారానికి అర్జెంట్ ప్రాధాన్యత.\n- **కేటగిరీ అనుకూలత (Category Preference):** శాకాహార/మాంసాహార ఎంపికలు.\n\nఇది యాదృచ్ఛికం (random) కాదు, ఖచ్చితమైన మ్యాథమెటికల్ ఆల్గోరిథం ద్వారా లెక్కించబడుతుంది!`,
        suggestions: [
          'స్మార్ట్ మ్యాచింగ్ పేజీ చూడండి',
          'ఆహార భద్రతా నియమాలు ఏమిటి?',
          'దాతలను ఎలా రేట్ చేయాలి?'
        ]
      };
    }
    return {
      reply: `Our AI Smart Matching Engine uses a multi-factor mathematical scoring model (0-100%):\n\n- **Proximity (Haversine Formula):** Prioritizes NGOs within 1-5 km to preserve freshness and reduce transit emissions.\n- **Quantity & Beneficiary Fit:** Matches donation portion sizes with shelter capacity.\n- **Shelf-Life Urgency:** Food nearing deadline is dynamically routed to the nearest available center.\n- **Food Type & Handling Capability:** Matches perishables with verified shelters having appropriate storage (hot held / refrigeration).\n\nNo guesswork or random picks — pure, explainable AI matching!`,
      suggestions: [
        'View the Smart Matching page',
        'How does food safety verification work?',
        'How can an NGO get verified?'
      ]
    };
  }

  if (query.includes('safety') || query.includes('safe') || query.includes('expire') || query.includes('భద్రత') || query.includes('ఎక్స్‌పైరీ')) {
    if (isTelugu) {
      return {
        reply: `ఆహార భద్రత మా మొదటి ప్రాధాన్యత!\n\n- **సురక్షిత గడువు (Safe Deadline):** గడువు ముగిసిన ఆహారాన్ని సిస్టమ్ ఆటోమేటిక్‌గా నిరోధిస్తుంది (Request నిరాకరించబడుతుంది).\n- **నిల్వ నిబంధనలు (Storage):** వేడి భోజనాలు 60°C పైన లేదా శీతలీకరించినవి (Refrigerated) 4°C కంటే తక్కువ ఉంచాలి.\n- **ముందస్తు తనిఖీ:** AI భద్రతా స్కోరు మరియు స్థితి (Safe to Consider, Needs Verification, Expired / Unsafe) చూపిస్తుంది.\n\n*గమనిక: AI మార్గదర్శకాలను మాత్రమే అందిస్తుంది; ఆహారాన్ని స్వీకరించే సమయంలో భౌతిక తనిఖీ తప్పనిసరి.*`,
        suggestions: [
          'ఎక్స్‌పైరీ అలర్ట్‌లు ఎలా వస్తాయి?',
          'ఆహారం ఎలా దానం చేయాలి?',
          'నివేదిక (Report issue) ఎలా ఇవ్వాలి?'
        ]
      };
    }
    return {
      reply: `Food safety is enforced systematically across the platform:\n\n- **Automated Deadline Expiry:** Food past its safe consumption deadline is instantly locked and cannot be requested.\n- **Storage Guidance:** Evaluates time elapsed against storage conditions (Hot Held >60°C, Chilled 0-4°C, or Ambient).\n- **Status Tiers:** Marked as *Safe to Consider*, *Needs Verification*, or *Expired / Unsafe*.\n\n> **Important Safety Note:** AI verification provides standards-based algorithmic guidance; physical inspection by receiving volunteers is always required prior to serving.`,
      suggestions: [
        'How do expiry notifications work?',
        'How do I report a suspicious listing?',
        'How to donate surplus food?'
      ]
    };
  }

  if (query.includes('register') || query.includes('ngo') || query.includes('signup') || query.includes('నమోదు') || query.includes('రిజిస్టర్')) {
    if (isTelugu) {
      return {
        reply: `స్వచ్ఛంద సంస్థలు (NGOలు) సులభంగా నమోదు చేసుకోవచ్చు:\n\n1. "Register" పేజీకి వెళ్లండి.\n2. పాత్రను **"Receiver (NGO / Shelter / Orphanage)"** గా ఎంచుకోండి.\n3. సంస్థ పేరు, కార్యకలాపాల రకం, ఫోన్, మరియు ఖచ్చితమైన చిరునామా నమోదు చేయండి.\n4. అడ్మిన్ ధృవీకరణ (Verification) చేసిన వెంటనే మీ ప్రొఫైల్‌కు ధృవీకరణ బ్యాడ్జ్ లభిస్తుంది!`,
        suggestions: [
          'ఆహారం ఎలా అభ్యర్థించాలి?',
          'సమీపంలో ఉన్న ఆహారం చూడండి',
          'అడ్మిన్ డ్యాష్‌బోర్డ్ ఎలా పనిచేస్తుంది?'
        ]
      };
    }
    return {
      reply: `Registering as an NGO, Shelter, or Orphanage takes under a minute:\n\n1. Click **Register** on the top right.\n2. Choose **Receiver (NGO, Shelter, Orphanage)**.\n3. Enter your organization name, registration details, address, and primary contact number.\n4. Set your average beneficiary capacity.\n5. Once registered, the Admin reviews and activates your verified badge for priority matching!`,
      suggestions: [
        'How do I search for available food?',
        'How does smart matching work?',
        'How to contact admin?'
      ]
    };
  }

  if (query.includes('telugu') || query.includes('తెలుగు') || query.includes('భాష')) {
    return {
      reply: `నమస్కారం! నేను ఆహార రక్షణ AI సహాయకుడిని. నేను తెలుగు మరియు ఇంగ్లీష్ రెండింటిలోనూ సమాధానాలు ఇవ్వగలను. మీరు ఆహారం దానం చేయడం, సమీపంలోని ఆహారాన్ని కనుగొనడం, ఆహార భద్రతా నియమాలు లేదా ఎన్జీవో రిజిస్ట్రేషన్ గురించి ఏమైనా అడగవచ్చు!`,
      suggestions: [
        'ఆహారం ఎలా దానం చేయాలి?',
        'ఆహారం కోసం ఎలా అభ్యర్థించాలి?',
        'AI స్మార్ట్ మ్యాచింగ్ ఎలా పనిచేస్తుంది?'
      ]
    };
  }

  // Default fallback response
  if (isTelugu) {
    return {
      reply: `నేను మీకు ఎలా సహాయపడగలను? మీరు ఆహార దానం, సమీప ఆహార సేకరణ, NGO రిజిస్ట్రేషన్, AI స్మార్ట్ మ్యాచింగ్ లేదా ఆహార భద్రత గురించి నన్ను అడగవచ్చు!`,
      suggestions: [
        'ఆహారం ఎలా దానం చేయాలి?',
        'అందుబాటులో ఉన్న ఆహారం ఎక్కడ ఉంది?',
        'ఆహార భద్రత నియమాలు ఏమిటి?'
      ]
    };
  }

  return {
    reply: `Hello! I am your AI Food Rescue & Donation Assistant. I can help guide you through donating surplus meals, discovering available food nearby, understanding our AI Smart Matching system, checking food safety compliance, or tracking donations.\n\nWhat would you like to explore today?`,
    suggestions: [
      'How can I donate surplus food?',
      'How does AI smart matching work?',
      'What are the food safety verification rules?',
      'How can NGOs register and request food?'
    ]
  };
}

module.exports = {
  calculateDistanceKm,
  verifyFoodSafety,
  calculateSmartMatch,
  handleAIChatbotQuery
};

