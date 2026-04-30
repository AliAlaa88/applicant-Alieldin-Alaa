{ pkgs, lib, config, inputs, ... }:

let
  pkgs-stable = import inputs.nixpkgs-stable { system = pkgs.stdenv.system; };
in
{
  devcontainer.enable = true;
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc.lib
      pkgs.glib
      pkgs.zlib
      pkgs.libglvnd
      pkgs.xorg.libX11
    ];
    DENO_UNSTABLE_SLOPPY_IMPORTS = "1";
    DENO_INSTALL = "${config.env.DEVENV_STATE}/.deno";
  };

  packages = with pkgs-stable; [
    nodePackages.npm
    jupyter
  ];

  languages.deno = {
    enable = true;
    package = pkgs.deno;
  };
  languages.javascript = {
    enable = true;
    package = pkgs-stable.nodejs-slim_20;
    pnpm.enable = true;
  };

  enterShell = ''
    export PATH="$DENO_INSTALL/bin:$PATH"
    # deno install --global -f --root "$DENO_INSTALL" -A jsr:@deno/deployctl
    deno jupyter --install --force
  '';
}
