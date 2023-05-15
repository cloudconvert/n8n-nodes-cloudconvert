# n8n-nodes-cloudconvert

This is an n8n community node. It lets you use [CloudConvert](https://cloudconvert.com) your n8n workflows.

CloudConvert is an online file conversion and processing API which allows to convert files, create thumbnails, merge files, add watermarks and more!

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  
[Version history](#version-history)  <!-- delete if not using this section -->  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

It supports these operations:

- Convert files from one format to another
- Create thumbnails of files
- Add watermarks to images, PDFs and videos
- Capture website screenshots and save websites as PDF
- Merge multiple input files in one single PDF
- Create archives (ZIP, RAR...) for multiple input files
- Get file metadata (EXIF etc)

## Credentials

Create a free CloudConvert account [here](https://cloudconvert.com/register) which allows 25 free credits per day.

- Generate OAuth 2 credentials (default auth method) here: https://cloudconvert.com/dashboard/api/v2/clients
- Generate an API key (alternative auth method) here: https://cloudconvert.com/dashboard/api/v2/keys

## Compatibility

Tested against n8n version 0.226+.

## Usage

A typical workflow using this node would look like this:
<img width="906" alt="image" src="https://github.com/n8n-io/n8n/assets/1945577/3cd6f332-74ee-4997-8e67-7d873a124592">

This is a workflow merging multiple input files in a single PDF:
<img width="1276" alt="image" src="https://github.com/n8n-io/n8n/assets/1945577/9324c941-eb86-48ac-8d83-aaeecf16fd09">



## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [CloudConvert API v2 Documentation](https://cloudconvert.com/api/v2)



