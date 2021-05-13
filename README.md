# Octo-Tag library help tagging in git

Octo-tag is a library that help you with versioning when adding a tag to remote/locally. 

It will automatically generate a version, calculated based on the previous version, if the tag on git doesn't have history, it will make new ones. 

## Installation

You can install globally by running this command

```bash
npm install -g octo-tag
```

or you just want to install in specific project, you can do with 
```bash
npm install octo-tag --dev
```

## Usage

running this command
```bash
octo-tag
```

when you running this command, it will give you some question and confirmation to make sure the tag is correct.

The questions consist of : 

1. Environment (Staging, Production or Beta), if you choose `staging`, octo-tag will add `alpha.1` in you tag, so the final tag will be 
`v0.0.1-alpha.1` and if you choose `production` will add tag like commonly `v0.0.1`.( and the last one is beta on progress)


2. Semantic Version Type (major, minor, patch), if you choose major, it will make the first number in your version increase, say you has  previous version i.e : `v1.0.0` when you choose `major` it will increase to `v2.0.0`, if you choose `minor`, it will increase secondary number to `v1.1.0`, and if you choose `patch` it will increase last number to `v1.0.1`.

3. Commit Id is used if you want add tag to specific commit/history id in your git.


### Prefix
if you want to add prefix i.e from `v1.0.0` to `octo-tag-1.0.0`, you can add argument `--prefix=customtag-` 
```bash
octo-tag --prefix=customtag-
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)