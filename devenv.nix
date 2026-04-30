{ pkgs, lib, config, inputs, ... }:

let
  pkgs-stable = import inputs.nixpkgs-stable { system = pkgs.stdenv.system; };
in
{
  devcontainer.enable = true;
  packages = with pkgs-stable; [
    nodePackages.pnpm
    nodePackages.npm
  ];

  cachix.enable = false;

  enterShell = ''
    echo "Dev environment ready"
    echo "npm: $(npm -v)"
    echo "pnpm: $(pnpm -v)"
    echo "biome: $(biome --version)"
  '';
}
