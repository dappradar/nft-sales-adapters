## Providers naming

* Use `kebab-case`
* Title of marketplace must be least 3 symbols long
* Full title of provider is more preferred. However,
  if the title has more than 25 symbols, we prefer
  abbreviations more
* Add protocol slug to the title of provider
  (e.g. `ethereum`)
* Number providers (e.g. `opensea-1`, `opensea-2`, ...)
  Numeration is not shared across different marketplaces
  (e.g. `opensea-1`, `rarible-1`, `rarible-2`, ...)

|     | Example              | Note                                                                  |
|-----|----------------------|-----------------------------------------------------------------------|
| ❌   | `os-ethereum-1`      | Name of provider is too short. It should be `opensea` instead of `os` |
| ❌   | `opensea-1`          | Missing protocol                                                      |
| ❌   | `opensea-ethereum`   | Missing numeration                                                    |
| ❌   | `ethereum-1`         | Missing title of marketplace                                          |
| ❌   | `r-bsc-1`            | Title of marketplace is too short                                     |
| ✅   | `opensea-ethereum-1` |                                                                       |
| ✅   | `rarible-bsc-1`      |                                                                       |
