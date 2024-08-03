"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  CapturedState,
  fetchPokemonOfCertainTypeAndByCapturedStatus,
  fetchPokemonWithFilters,
  getAllPokemon,
  updatePokemonCapturedStatus,
} from "../api/pokemon";
import { Pokemon } from "../api/pokemon";
import styles from "./pokemon.module.css";

const capturedStates = ["All", "Captured", "Not captured"];
type PokemonType = (typeof pokemonTypes)[number];
// type CapturedState = (typeof capturedStates)[number];

type FrontendPokemon = Pokemon & {
  frontendFields: {
    networkRequestOngoing: boolean;
  };
};

const pokemonTypes = [
  "All",
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

const Spinner = () => {
  return <span className={styles.spinner}></span>;
};

const Select = ({
  name,
  options,
  currentValue,
  onChange,
  labelText,
}: {
  name: string;
  options: string[];
  currentValue: string;
  onChange: (param: string) => void;
  labelText?: string;
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label htmlFor={name} style={{ fontSize: "small" }}>
        {labelText}
      </label>

      <select
        name={name}
        id={name}
        onChange={(e) => onChange(e.target.value)}
        value={currentValue}
        style={{ padding: "15px 60px" }}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
};

const Selectors = ({
  onCapturedStateChange,
  capturedStateValue,
  onTypeChange,
  typeValue,
}: {
  onCapturedStateChange: (param: CapturedState) => void;
  capturedStateValue: CapturedState;
  onTypeChange: (param: PokemonType) => void;
  typeValue: PokemonType;
}) => {
  return (
    <div className={styles.selectorsContainer}>
      <Select
        name="pokemonType"
        options={pokemonTypes}
        onChange={onTypeChange}
        currentValue={typeValue}
        labelText="Type"
      />
      <Select
        name="capturedState"
        onChange={(e) => onCapturedStateChange(e as CapturedState)}
        currentValue={capturedStateValue}
        options={capturedStates}
        labelText="Captured"
      ></Select>
    </div>
  );
};

const PokemonCard = ({
  pokemon,
  updatePokemonCaptured,
}: {
  pokemon: FrontendPokemon;
  updatePokemonCaptured: (id: number, captured: boolean) => void;
}) => {
  const typesText = pokemon.pokemonTypes.join(", ");
  const idAsStr = `${pokemon.id}`;
  return (
    <div className={styles.pokemonCardContainer}>
      <div className={`${styles.flexColumnCenter} ${styles.pokemonCard}`}>
        <span>{pokemon.id}</span>
        <Image
          src={pokemon.imgUrl}
          alt={`Picture of pokemon ${pokemon.name}`}
          width={150}
          height={150}
        />
        <div className={styles.flexColumnCenter}>
          <p className={styles.nameText}>{pokemon.name}</p>
          <p>{typesText}</p>
        </div>

        <input
          checked={pokemon.captured}
          type="checkbox"
          className={styles.checkbox}
          id={idAsStr}
          onChange={(e) => updatePokemonCaptured(pokemon.id, e.target.checked)}
        />
        <label htmlFor={idAsStr} className={styles.switch}></label>
      </div>
      {pokemon.frontendFields.networkRequestOngoing && (
        <div className={styles.pokemonCardOverlay}>
          <div>
            <Spinner />
          </div>
        </div>
      )}
    </div>
  );
};

const PokemonList = ({
  visiblePokemon,
  updatePokemonCaptured,
}: {
  visiblePokemon: FrontendPokemon[];
  updatePokemonCaptured: (id: number, captured: boolean) => void;
}) => {
  return (
    <div className={styles.pokemonListContainer}>
      {visiblePokemon.map((pokemon) => (
        <PokemonCard
          pokemon={pokemon}
          key={pokemon.id}
          updatePokemonCaptured={updatePokemonCaptured}
        />
      ))}
    </div>
  );
};

const fetchData = async (capturedStateFilter: CapturedState, type: string) => {
  const res = await fetchPokemonWithFilters({
    capturedState: capturedStateFilter,
    pokemonType: type,
  });
  return res.data.queryPokemon;
};

export default function PokemonListing() {
  const [isCapturedFilterEnabled, setIsCapturedFilterEnabled] =
    useState<CapturedState>("All");
  const [pokemonTypeFilter, setPokemonTypeFilter] =
    useState<PokemonType>("Grass");
  const [filteredPokemon, setFilteredPokemon] = useState<FrontendPokemon[]>([]);

  useEffect(() => {
    fetchData(isCapturedFilterEnabled, pokemonTypeFilter).then((data) => {
      const updatedData = data.map((p) => ({
        ...p,
        frontendFields: {
          networkRequestOngoing: false,
        },
      }));
      setFilteredPokemon(updatedData);
    });
  }, [isCapturedFilterEnabled, pokemonTypeFilter]);

  const setPokemonCaptured = async (id: number, captured: boolean) => {
    const updatedLocalData = filteredPokemon.map((p) =>
      p.id === id
        ? { ...p, frontendFields: { networkRequestOngoing: true } }
        : p
    );
    setFilteredPokemon(updatedLocalData);

    await updatePokemonCapturedStatus(id, captured);
    fetchData(isCapturedFilterEnabled, pokemonTypeFilter).then((data) => {
      const updatedData = data.map((p) => ({
        ...p,
        frontendFields: {
          networkRequestOngoing: false,
        },
      }));

      setFilteredPokemon(updatedData);
    });
  };

  const onCapturedFilterChange = (captured: CapturedState) => {
    setIsCapturedFilterEnabled(captured);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginLeft: "10vw",
        marginRight: "10vw",
        gap: "5vh",
      }}
    >
      <Image src="/s-l1600.png" width={370} height={300} alt="Pokemon logo" />
      <Selectors
        onCapturedStateChange={onCapturedFilterChange}
        capturedStateValue={isCapturedFilterEnabled}
        onTypeChange={setPokemonTypeFilter}
        typeValue={pokemonTypeFilter}
      />
      <PokemonList
        visiblePokemon={filteredPokemon}
        updatePokemonCaptured={setPokemonCaptured}
      />
    </div>
  );
}
