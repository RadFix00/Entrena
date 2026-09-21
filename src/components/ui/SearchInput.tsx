import {
  Search,
} from "lucide-react";

import type {
  InputHTMLAttributes,
} from "react";

import Input from "./Input";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "leftIcon"
>;

export default function SearchInput(
  props: Props
) {
  return (
    <Input
      leftIcon={
        <Search
          size={18}
        />
      }
      placeholder="Buscar..."
      {...props}
    />
  );
}
