**Function:** `getRecipeByUri(uri: string)`

This function retrieves detailed information about a specific recipe using its unique URI.

### Example Response

```json
{
  "uri": "http://www.edamam.com/ontologies/edamam.owl#recipe_cd499b6c8c7fdf4a24cac93ae000bc4f",
  "label": "Turkish Corn Bread recipes",
  "image": "https://edamam-product-images.s3.amazonaws.com/web-img/871/871e85f178bf3bb5a7eba9f14258f99e...",
  "images": {
    "THUMBNAIL": {
      "url": "https://edamam-product-images.s3.amazonaws.com/web-img/871/871e85f178bf3bb5a7eba9f14258f99e-s...",
      "width": 100,
      "height": 100
    },
    "SMALL": {
      "url": "https://edamam-product-images.s3.amazonaws.com/web-img/871/871e85f178bf3bb5a7eba9f14258f99e-m...",
      "width": 200,
      "height": 200
    },
    "REGULAR": {
      "url": "https://edamam-product-images.s3.amazonaws.com/web-img/871/871e85f178bf3bb5a7eba9f14258f99e...",
      "width": 300,
      "height": 300
    }
  },
  "source": "turkishstylecooking.com",
  "url": "http://turkishstylecooking.com/turkish-corn-bread-recipe.html",
  "shareAs": "http://www.edamam.com/recipe/turkish-corn-bread-recipes-cd499b6c8c7fdf4a24cac93ae000bc4f/-",
  "yield": 4,
  "dietLabels": [],
  "healthLabels": [
    "Sugar-Conscious",
    "Vegetarian",
    "Pescatarian",
    "Mediterranean",
    "Peanut-Free",
    "Tree-Nut-Free",
    "Soy-Free",
    "Fish-Free",
    "Shellfish-Free",
    "Pork-Free",
    "Red-Meat-Free",
    "Crustacean-Free",
    "Celery-Free",
    "Mustard-Free",
    "Sesame-Free",
    "Lupine-Free",
    "Mollusk-Free",
    "Alcohol-Free",
    "Kosher"
  ],
  "cautions": [],
  "ingredientLines": [
    "1 egg,",
    "1 cup milk,",
    "1/2 cup vegetable oil,",
    "2,5 cups corn flour (not corn starch, corn flour is finely ground polenta flour),",
    "10 g baking powder,",
    "salt"
  ],
  "ingredients": [
    {
      "text": "1 egg,",
      "quantity": 1,
      "measure": "<unit>",
      "food": "egg",
      "weight": 43,
      "foodCategory": "Eggs",
      "foodId": "food_bhpradua77pk16aipcvzeayg732r",
      "image": "https://www.edamam.com/food-img/a7e/a7ec7c337cb47c6550b3b118e357f077.jpg"
    },
    {
      "text": "1 cup milk,",
      "quantity": 1,
      "measure": "cup",
      "food": "milk",
      "weight": 244,
      "foodCategory": "Milk",
      "foodId": "food_b49rs1kaw0jktabzkg2vvanvvsis",
      "image": "https://www.edamam.com/food-img/7c9/7c9962acf83654a8d98ea6a2ade93735.jpg"
    }
    // ... additional ingredients
  ],
  "calories": 2240.060000016739,
  "totalWeight": 695.661477115307,
  "totalTime": 30,
  "cuisineType": ["middle eastern"],
  "mealType": ["breakfast"],
  "dishType": ["bread"],
  "totalNutrients": {
    "ENERC_KCAL": { "label": "Energy", "quantity": 2240.06, "unit": "kcal" },
    "FAT": { "label": "Fat", "quantity": 134.54, "unit": "g" },
    "CHOCDF": { "label": "Carbs", "quantity": 232.74, "unit": "g" },
    "PROCNT": { "label": "Protein", "quantity": 37.23, "unit": "g" }
    // ... extensive nutrient list
  }
}
```

## 2. Generate Meal Plan

**Function:** `generateMealPlan(request: EdamamMealPlanRequest)`

Generates a meal plan based on constraints (calories, diet labels, etc.).

### Example Response

```json
{
  "selection": [
    {
      "sections": {
        "Breakfast": {
          "assigned": "http://www.edamam.com/ontologies/edamam.owl#recipe_cd499b6c8c7fdf4a24cac93ae000bc4f",
          "_links": {
            "self": {
              "href": "https://api.edamam.com/api/recipes/v2/cd499b6c8c7fdf4a24cac93ae000bc4f",
              "title": "Recipe details"
            }
          }
        },
        "Lunch": {
          "assigned": "http://www.edamam.com/ontologies/edamam.owl#recipe_53a79959d44a810ffe40c28c4b26380d",
          "_links": {
            "self": {
              "href": "https://api.edamam.com/api/recipes/v2/53a79959d44a810ffe40c28c4b26380d",
              "title": "Recipe details"
            }
          }
        },
        "Dinner": {
          "assigned": "http://www.edamam.com/ontologies/edamam.owl#recipe_8203492866a98977e9a7f13b9f6a29aa",
          "_links": {
            "self": {
              "href": "https://api.edamam.com/api/recipes/v2/8203492866a98977e9a7f13b9f6a29aa",
              "title": "Recipe details"
            }
          }
        }
      }
    }
    // ... additional days
  ],
  "status": "OK"
}
```

## 3. Generate Shopping List

**Function:** `generateShoppingList(request: EdamamShoppingListRequest)`

Aggregates ingredients from recipes into a shopping list.

### Example Response

```json
{
  "entries": [
    {
      "foodId": "food_bhpradua77pk16aipcvzeayg732r",
      "food": "egg",
      "quantities": [
        {
          "quantity": 1,
          "measure": "http://www.edamam.com/ontologies/edamam.owl#Measure_unit",
          "weight": 43
        }
      ]
    },
    {
      "foodId": "food_b49rs1kaw0jktabzkg2vvanvvsis",
      "food": "whole milk",
      "quantities": [
        {
          "quantity": 244,
          "measure": "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
          "weight": 244
        }
      ]
    },
    {
      "foodId": "food_bt1mzi2ah2sfg8bv7no1qai83w8s",
      "food": "vegetable oil",
      "quantities": [
        {
          "quantity": 112.00,
          "measure": "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
          "weight": 112.00
        }
      ]
    },
    {
      "foodId": "food_b2kpkh4acfeyuoaktkafwbjq55r7",
      "food": "corn flour",
      "quantities": [
        {
          "quantity": 285,
          "measure": "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
          "weight": 285
        }
      ]
    },
    {
      "foodId": "food_bad4zycbt4w60dbut111vaub2g3e",
      "food": "baking powder",
      "quantities": [
        {
          "quantity": 10,
          "measure": "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
          "weight": 10
        }
      ]
    },
    {
      "foodId": "food_btxz81db72hwbra2pncvebzzzum9",
      "food": "salt",
      "quantities": [
        {
          "quantity": 0,
          "measure": "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
          "weight": 0
        }
      ]
    }
  ]
}
```

#Open AI response
```json
{
  "daily_calories": {
    "min": 1800,
    "max": 2200,
    "label": "Calories"
  },
  "nutrients": {
    "NA": {
      "max": 1500,
      "label": "Sodium"
    },
    "K": {
      "max": 2000,
      "label": "Potassium"
    },
    "P": {
      "max": 800,
      "label": "Phosphorus"
    },
    "PROCNT": {
      "min": 60,
      "max": 75,
      "label": "Protein"
    },
    "CHOCDF": {
      "min": 225,
      "max": 275,
      "label": "Carbohydrates"
    },
    "SUGAR": {
      "max": 25,
      "label": "Sugars"
    },
    "FIBTG": {
      "min": 30,
      "label": "Fiber"
    },
    "CHOLE": {
      "max": 200,
      "label": "Cholesterol"
    }
  },
  "avoid_ingredients": [
    "high-phosphorus foods",
    "high-potassium foods",
    "high-sodium foods",
    "added sugars"
  ],
  "reasoning": "The patient has CKD stage 3b-5, requiring strict limits on phosphorus and potassium to prevent further kidney damage. Sodium is limited due to hypertension, and carbohydrates and sugars are controlled to manage type 2 diabetes. Protein intake is moderated to reduce kidney workload, while fiber is prioritized to aid in blood sugar control and overall health."
}
```

```json
{
  "success":true,
  "data":{"id":"6lzTpk4ecsktYjxEzu9ODekGGaIKl0TL",
  "name":"Rashid Taha Khan",
  "email":"tahaharbour@gmail.com",
  "emailVerified":true,
  "image":"https://lh3.googleusercontent.com/a/ACg8ocK1Ld00x7VNAcCEgeWym39lddR5oSoZBKDAW880IYo7FnIi1hhJ=s96-c","createdAt":"2026-01-14T04:36:25.012Z","updatedAt":"2026-01-14T04:37:08.350Z","age":23,"conditions":"[\"t2d\",\"htn\"]","primaryAnchor":null,
  "onboardingData":"
      {\"biometrics\":{\"height\":160,\"weight\":83,\"waist\":0,\"age\":23,\"gender\":\"Male\"},\"medical\":{\"insulin\":false,\"medications\":[{\"name\":\"Tylenol\",\"rxnorm_rxcui\":\"202433\",\"openfda_rxcui\":[\"198440\",\"209459\"],\"ingredients\":[\"ACETAMINOPHEN\"],\"interactions\":\"Consult a doctor for food interactions.\",\"pharm_class\":[],\"warnings\":[\"Warnings Liver warning This product contains acetaminophen. Severe liver damage may occur if you take more than 4,000 mg of acetaminophen in 24 hours with other drugs containing acetaminophen 3 or more alcoholic drinks every day while using this product Allergy alert: acetaminophen may cause severe skin reactions. Symptoms may include: skin reddening blisters rash If a skin reaction occurs, stop use and seek medical help right away. Do not use with any other drug containing acetaminophen (prescription or nonprescription). If you are not sure whether a drug contains acetaminophen, ask a doctor or pharmacist. if you are allergic to acetaminophen or any of the inactive ingredients in this product Ask a doctor before use if you have liver disease Ask a doctor or pharmacist before use if you are taking the blood thinning drug warfarin Stop use and ask a doctor if pain gets worse or lasts more than 10 days fever gets worse or lasts more than 3 days new symptoms occur redness or swelling is present These could be signs of a serious condition. If pregnant or breast-feeding, ask a health professional before use. Keep out of reach of children. Overdose warning In case of overdose, get medical help or contact a Poison Control Center right away. (1-800-222-1222) Quick medical attention is critical for adults as well as for children even if you do not notice any signs or symptoms.\"],\"purpose\":[\"Purpose Pain reliever/fever reducer\"],\"pregnancy_or_breast_feeding\":[\"If pregnant or breast-feeding, ask a health professional before use.\"],\"substance_name\":[\"ACETAMINOPHEN\"]},{\"name\":\"melatonin\",\"rxnorm_rxcui\":\"6711\",\"openfda_rxcui\":[],\"ingredients\":[\"ARNICA MONTANA\",\"BARIUM CARBONATE\",\"BARIUM OXALOSUCCINATE\",\"BRAIN-DERIVED NEUROTROPHIC FACTOR HUMAN\",\"CORTICOTROPIN\",\"LEAD\",\"LEVOTHYROXINE\",\"LUTRELIN\",\"MALIC ACID\",\"MELATONIN\",\"NEUROTROPHIN-3\",\"NEUROTROPHIN-4\",\"OXYTOCIN\",\"PHENYLALANINE\",\"PORK LIVER\",\"PYRUVIC ACID\",\"QUINONE\",\"RINFABATE\",\"SUS SCROFA ADRENAL GLAND\",\"SUS SCROFA FRONTAL LOBE\",\"SUS SCROFA HYPOTHALAMUS\",\"THYROTROPIN ALFA\"],\"interactions\":\"Consult a doctor for food interactions.\",\"pharm_class\":[\"Adrenocorticotropic Hormone [EPC]\",\"l-Thyroxine [EPC]\",\"Oxytocic [EPC]\",\"Thyroid Stimulating Hormone [EPC]\"],\"warnings\":[\"WARNINGS Stop use and ask doctor if symptoms persist more than 5 days. If pregnant or breast-feeding ask a health professional before use. Keep out of reach of children. In case of overdose, get medical help or contact a Poison Control Center right away. Contains ethyl alcohol 30%\"],\"purpose\":[\"For the temporary relief symptoms due to aging, scuh as: poor memory impaired concentration\"],\"pregnancy_or_breast_feeding\":[\"PREGNANCY If pregnant or breast-feeding ask a doctor before use\"],\"substance_name\":[\"ARNICA MONTANA\",\"BARIUM CARBONATE\",\"BARIUM OXALOSUCCINATE\",\"BRAIN-DERIVED NEUROTROPHIC FACTOR HUMAN\",\"CORTICOTROPIN\",\"LEAD\",\"LEVOTHYROXINE\",\"LUTRELIN\",\"MALIC ACID\",\"MELATONIN\",\"NEUROTROPHIN-3\",\"NEUROTROPHIN-4\",\"OXYTOCIN\",\"PHENYLALANINE\",\"PORK LIVER\",\"PYRUVIC ACID\",\"QUINONE\",\"RINFABATE\",\"SUS SCROFA ADRENAL GLAND\",\"SUS SCROFA FRONTAL LOBE\",\"SUS SCROFA HYPOTHALAMUS\",\"THYROTROPIN ALFA\"]}]},\"dietary\":{\"favorites\":[],\"dislikes\":[],\"favCuisines\":[\"Mediterranean\",\"Italian\",\"Korean\"],\"dislikeCuisines\":[]},\"conditions\":[\"t2d\",\"htn\"]}",
  "nutritionLimits":"
      {\"daily_calories\":{\"min\":1800,\"max\":2200,\"label\":\"Calories\"},\"nutrients\":{\"NA\":{\"max\":1500,\"label\":\"Sodium\",\"unit\":\"mg\"},\"K\":{\"max\":3000,\"label\":\"Potassium\",\"unit\":\"mg\"},\"P\":{\"max\":800,\"label\":\"Phosphorus\",\"unit\":\"mg\"},\"PROCNT\":{\"min\":60,\"max\":75,\"label\":\"Protein\",\"unit\":\"g\"},\"CHOCDF\":{\"min\":225,\"max\":275,\"label\":\"Carbohydrates\",\"unit\":\"g\"},\"SUGAR\":{\"max\":30,\"label\":\"Sugars\",\"unit\":\"g\"},\"FIBTG\":{\"min\":25,\"label\":\"Fiber\",\"unit\":\"g\"},\"CHOLE\":{\"max\":200,\"label\":\"Cholesterol\",\"unit\":\"mg\"}},\"avoid_ingredients\":[\"high-sodium foods\",\"processed meats\"],\"reasoning\":\"Limits are set to manage hypertension, control blood sugar levels, and reduce kidney strain.\"}
  ",
  "metricLogs":[],
  "savedRecipes":[],
  "groceryItems":[]
  }}
```