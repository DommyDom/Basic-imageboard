# Basic-imageboard
A partially fleshed out imageboard made in nodejs and various modules


## how to install
Redirect to the imageboard folder and type 
```
npm install
```
and then all the dependencies will install. Then type
```
node index
```
to run the app

## features
* thread posts with mandetory image upload
* comments to threads with optional image upload
* very barebones quoting system. start with ">" at the beginning of a line to quote text and ">>" to refer to a previous post
* Admin panel with login system, although you have to manually create a users collection in mongodb and insert a document with username:String and password:String that has to manually be hashed with bcrypt. The admin can IP ban and delete posts.
* Bumb system where every thread that is inactive for an hour gets deleted(along with the images). the bump limit is 300 and the threads in the catalog is sorted after bumps.


## might implement if i ever get back at this project
* clearly have to make thumbnails as downloading several images with megagbytes in size is not optimal
* the looks of the website should be improved.
* there should be a google capcha for every post so the website don't get spammed
* the quoting system should be improved.
