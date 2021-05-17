# Octo-Tag library help tagging in git

![octo-tag](https://i.ibb.co/10gk9RG/Screen-Shot-2021-05-17-at-18-34-59.png)


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
4. Confirmation to add tag
5. Confirmation to push tag, in this step you can choose, you want to push the tag to remote/origin or not.


### Prefix
if you want to add prefix i.e from `v1.0.0` to `octo-tag-1.0.0`, you can add argument `--prefix=customtag-` 
```bash
octo-tag --prefix=customtag-
```


### How Octo-Tag Works : 
#### Calculate Versioning : 
1. octo-tag will get latest version in remote, if the latest version is v1.0.0, and you choose environment `staging` and semantic version `major`. the versioning will generate `v2.0.0-alpha.1`. or if `beta` selected it will have `v2.0.0-beta.1`.


2. If the `v2.0.0-alpha.1` is exist, it will increase latest number, so the output will `v2.0.0-alpha.2`



## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)