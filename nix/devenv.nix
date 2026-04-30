{ pkgs, ... }: {
  packages = with pkgs; [
    curl
    jq
    podman-compose
    docker-compose
    fzf
    gh
  ];
  git-hooks.hooks = {
    nixpkgs-fmt.enable = true;
  };
}
