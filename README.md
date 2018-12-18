# OSS-Reader

[![NPM version](https://img.shields.io/npm/v/oss-reader.svg?style=flat-square)](https://npmjs.org/package/oss-reader)

OSS-Reader is a `CLI` tool for reading contents from OSS bucket.

## Installation

Use `npm` or `yarn` to install OSS-Reader.

```bash
npm install -g oss-reader
# or
yarn global add oss-reader
```

## Usage

For now, you could just list objects in buckets.

```bash
oss-reader ls <bucketname> -k <OSS secret ID>
```

The full options as this:

```bash
Usage: list|ls [options] <bucket>

Retrive the full `Objects` list from <bucket>. Arguments has the some meaning to https://help.aliyun.com/document_detail/31965.html?spm=a2c4g.11186623.6.1066.730f7b55pV4ySM .

Options:
  -k, --id <id>            The Access Key ID created by Aliyun.
  -s, --secret <string>    The Access Key Secret created by Aliyun.
  -r, --region <string>    Optional. The region of bucket, default to "oss-cn-hangzhou".
  -p, --prefix <string>    Optional. The prefix path of `Objects`, we would just fetch thing behind this path if provided.
  -m, --marker <marker>    Optional. Start point for fetching.
  -o, --outfile <outfile>  Optional. We would save the `Objects` list if provided.
  -h, --help               output usage information
```

## TODO

- [ ] Implement "**sample**" feature to fetch partial object list from OSS.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
