### CloudCats: Worker

The CloudCats worker process is responsible for scraping /r/aww using the JSON API, performing the image analysis with the Google Cloud Vision API, and then publishing the results into a Cloud PubSub topic.  

CloudCats is an example of using 

**This is an adaptation of the [awwvision][1], which uses [Kubernetes][2] to do something similar.  Credit to [Jon Parrot][3] for the idea.**




[1]: https://github.com/GoogleCloudPlatform/cloud-vision/tree/master/python/awwvision
[2]: http://kubernetes.io/
[3]: https://github.com/jonparrott


