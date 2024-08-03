"use server";

import { pokemonData } from "./pokemonData";

const localPokemonData = pokemonData.map((p) => ({ ...p }));

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const pokemonTypes = [
  "Bug",
  "Dark",
  "Dragon",
  "Electric",
  "Fairy",
  "Fighting",
  "Fire",
  "Flying",
  "Ghost",
  "Grass",
  "Ground",
  "Ice",
  "Normal",
  "Poison",
  "Psychic",
  "Rock",
  "Steel",
  "Water",
];

export type CapturedState = "All" | "Captured" | "Not captured";

export type Pokemon = {
  id: number;
  name: string;
  captured: boolean;
  imgUrl: string;
  // pokemonTypes: (typeof pokemonTypes)[];
  pokemonTypes: string[];
};

type QueryResponse = {
  data: {
    queryPokemon: Pokemon[];
  };
};

const fetchAllPokemonOperationsDoc = `
  query fetchAllPokemon {
    queryPokemon {
      id
      name
      captured
      imgUrl
      pokemonTypes
    }
  }
`;

// Update the Pokemon Captured Status - GraphQL
const updatePokemonCapturedStatusOperationsDoc = (
  pokemonId: string,
  newIsCapturedValue: boolean
) => `
  mutation updatePokemonCapturedStatus {
    updatePokemon(input: {filter: {id: {eq: ${pokemonId}}}, set: {captured: ${newIsCapturedValue}}}) {
      pokemon {
        id
        name
        captured
        imgUrl
        pokemonTypes
      }
    }
  }
`;

const fetchPokemonOfCertainTypeAndByCapturedStatusOperationsDoc = ({
  pokemonType,
  isCaptured,
}: {
  pokemonType: string;
  isCaptured: boolean;
}) =>
  `
    query fetchPokemonOfCertainTypeAndByCapturedStatus {
      queryPokemon(filter: { captured: ${isCaptured}, pokemonTypes: { eq: ${pokemonType} } }) {
        id
        name
        captured
        imgUrl
        pokemonTypes
      }
    }`;

const fetchGraphQL = async (
  query: string,
  operationName: string,
  variables: any
) => {
  return fetch(
    "https://nameless-brook-630061.eu-central-1.aws.cloud.dgraph.io/graphql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        operationName: operationName,
        variables,
      }),
    }
  );
};

export const getAllPokemon = async (): Promise<QueryResponse> => {
  // const response = await fetchGraphQL(
  //   fetchAllPokemonOperationsDoc,
  //   "fetchAllPokemon",
  //   {}
  // );
  // return await response.json();

  const data = localPokemonData;
  const sorted = data.sort((current, previous) =>
    current.id < previous.id ? -1 : 1
  );
  return new Promise((resolve) => {
    resolve({
      data: {
        queryPokemon: sorted as Pokemon[],
      },
    });
  });
};

export async function fetchPokemonOfCertainTypeAndByCapturedStatus({
  pokemonType,
  isCaptured,
}: {
  pokemonType: string;
  isCaptured: boolean;
}): Promise<QueryResponse> {
  // const response = await fetchGraphQL(
  //   fetchPokemonOfCertainTypeAndByCapturedStatusOperationsDoc({
  //     pokemonType,
  //     isCaptured,
  //   }),
  //   "fetchPokemonOfCertainTypeAndByCapturedStatus",
  //   {}
  // );
  // return await response.json();

  // fake out the graphql query since the free to use API has a shitty limit
  const data = localPokemonData.filter(
    (pokemon) =>
      pokemon.pokemonTypes.includes(pokemonType) &&
      pokemon.captured == isCaptured
  );
  const sorted = data.sort((current, previous) =>
    current.id < previous.id ? -1 : 1
  );
  return new Promise((resolve) => {
    resolve({
      data: {
        queryPokemon: sorted as Pokemon[],
      },
    });
  });
}

type FetchPokemonFilters = {
  capturedState: CapturedState;
  pokemonType: (typeof pokemonTypes)[number];
};

export const fetchPokemonWithFilters = async (
  filters: FetchPokemonFilters
): Promise<QueryResponse> => {
  const filterByType = (p: Pokemon) =>
    filters.pokemonType === "All" ||
    p.pokemonTypes.includes(filters.pokemonType);

  const filterByCaught = (p: Pokemon) => {
    if (filters.capturedState === "All") {
      return true;
    }
    const asBool = filters.capturedState === "Captured";
    return p.captured == asBool;
  };

  let pokemon = localPokemonData;
  if (filters.pokemonType === "All" && filters.capturedState === "All") {
    return {
      data: {
        queryPokemon: pokemon,
      },
    };
  }

  return new Promise((resolve) => {
    const filtered = pokemon.filter(filterByType).filter(filterByCaught);
    resolve({
      data: {
        queryPokemon: filtered,
      },
    });
  });
};

export async function updatePokemonCapturedStatus(
  pokemonId: number,
  newIsCapturedValue: boolean
) {
  // return fetchGraphQL(
  //   updatePokemonCapturedStatusOperationsDoc(pokemonId, newIsCapturedValue),
  //   "updatePokemonCapturedStatus",
  //   {}
  // );

  // fake a network call
  const index = localPokemonData.findIndex(
    (pokemon) => pokemon.id == pokemonId
  );
  localPokemonData[index].captured = newIsCapturedValue;
  await sleep(500);
  return new Promise((resolve) => {
    resolve(undefined);
  });
}
