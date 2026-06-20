import emissionFactorsData from '../../data/emission_factors.json';

const factors = emissionFactorsData.factors;

export interface AssessmentData {
  transport: {
    carMiles: number;
    carType: 'petrol' | 'diesel' | 'ev';
    flightShort: number;
    flightLong: number;
  };
  energy: {
    electricityKwh: number;
    heatingOilLiters?: number;
    naturalGasKwh?: number;
  };
  diet: 'heavy_meat' | 'average' | 'pescatarian' | 'vegetarian' | 'vegan';
  shopping: {
    clothingItems: number;
    electronicsItems: number;
  };
  waste: {
    generalKg: number;
    recyclingKg: number;
  };
}

const finiteNumber = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

const validCarType = (value: unknown): AssessmentData['transport']['carType'] => {
  return value === 'diesel' || value === 'ev' || value === 'petrol' ? value : 'petrol';
};

const validDiet = (value: unknown): AssessmentData['diet'] => {
  return value === 'heavy_meat' || value === 'pescatarian' || value === 'vegetarian' || value === 'vegan' || value === 'average'
    ? value
    : 'average';
};

export const normalizeAssessmentData = (data: AssessmentData): AssessmentData => ({
  transport: {
    carMiles: finiteNumber(data.transport?.carMiles),
    carType: validCarType(data.transport?.carType),
    flightShort: finiteNumber(data.transport?.flightShort),
    flightLong: finiteNumber(data.transport?.flightLong),
  },
  energy: {
    electricityKwh: finiteNumber(data.energy?.electricityKwh),
    heatingOilLiters: finiteNumber(data.energy?.heatingOilLiters),
    naturalGasKwh: finiteNumber(data.energy?.naturalGasKwh),
  },
  diet: validDiet(data.diet),
  shopping: {
    clothingItems: finiteNumber(data.shopping?.clothingItems),
    electronicsItems: finiteNumber(data.shopping?.electronicsItems),
  },
  waste: {
    generalKg: finiteNumber(data.waste?.generalKg),
    recyclingKg: finiteNumber(data.waste?.recyclingKg),
  },
});

export const calculateCarbonFootprint = (input: AssessmentData) => {
  const data = normalizeAssessmentData(input);

  const carFactorMap = {
    petrol: factors.transport.car_petrol,
    diesel: factors.transport.car_diesel,
    ev: factors.transport.car_ev,
  };

  const carFactor = finiteNumber(carFactorMap[data.transport.carType]);
  const carKm = data.transport.carMiles * 1.60934;

  const directTransportEmissions = carKm * (data.transport.carType === 'ev' ? 0 : carFactor);
  const indirectTransportEmissions = (carKm * (data.transport.carType === 'ev' ? carFactor : 0)) +
    (data.transport.flightShort * finiteNumber(factors.transport.flight_short)) +
    (data.transport.flightLong * finiteNumber(factors.transport.flight_long));

  const transportEmissions = directTransportEmissions + indirectTransportEmissions;

  const scope1Energy = (data.energy.heatingOilLiters || 0) * finiteNumber(factors.energy.heating_oil) +
    (data.energy.naturalGasKwh || 0) * finiteNumber(factors.energy.natural_gas);

  const scope2Energy = data.energy.electricityKwh * finiteNumber(factors.energy.electricity_grid_us);
  const energyEmissions = scope1Energy + scope2Energy;

  const dietFactorMap = {
    heavy_meat: factors.diet.meat_heavy,
    average: factors.diet.meat_average,
    pescatarian: factors.diet.pescatarian,
    vegetarian: factors.diet.vegetarian,
    vegan: factors.diet.vegan,
  };
  const dietEmissions = finiteNumber(dietFactorMap[data.diet]) * 30;

  const shoppingEmissions =
    data.shopping.clothingItems * finiteNumber(factors.shopping.clothing) +
    data.shopping.electronicsItems * finiteNumber(factors.shopping.electronics);

  const wasteEmissions =
    data.waste.generalKg * finiteNumber(factors.waste.general) +
    data.waste.recyclingKg * finiteNumber(factors.waste.recycling);

  const total = transportEmissions + energyEmissions + dietEmissions + shoppingEmissions + wasteEmissions;

  return {
    total,
    breakdown: {
      transport: transportEmissions,
      energy: energyEmissions,
      diet: dietEmissions,
      shopping: shoppingEmissions,
      waste: wasteEmissions
    },
    scopes: {
      scope1: directTransportEmissions + scope1Energy,
      scope2: scope2Energy,
      scope3: indirectTransportEmissions + dietEmissions + shoppingEmissions + wasteEmissions
    }
  };
};
