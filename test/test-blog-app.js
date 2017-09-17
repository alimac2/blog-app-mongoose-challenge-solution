const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

// const {DATABASE_URL} = require('../config');   example did not have this but I understand 
const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config'); // now I don't know where this comes from

chai.use(chaiHttp);

function seedBlogPostData() {
    console.info('seeding blog post data');
    const seedData = [];
  
    for (let i=1; i<=10; i++) {
      seedData.push(generateBlogPostData());
    }
    // this will return a promise -- how do we know this???
    return BlogPost.insertMany(seedData);
  }
  
  // used to generate data to put in db
  function generateTitleName() {
    const titles = [
      'Hakuna Matata', 'Sick Sad World', 'Zippy Doo Dah'];
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  function generateContentGenre() {
    const genres = ['Romance', 'Thriller', 'Suspense'];
    return genres[Math.floor(Math.random() * genres.length)];
  }
  

  //revisit - don't know what to do
  function generateAuthor() {
    const authors = ['Timon and Pumba', 'Daria Morgendorffer', 'Blue Bird'];
    const author = authors[Math.floor(Math.random() * authors.length)];
    return author
  }
  
  function generateBlogPostData() {
    return {
      title: faker.generateTitleName(),
      content: generateContentGenre(),
      author: generateAuthor(),
    }
  }
  
  function tearDownDb() {
      console.warn('Deleting database');
      return mongoose.connection.dropDatabase();
  }
  // does it matter wear the tearDownDb function is placed?


  describe('BLogPost API resource', function() {
  
    before(function() {
      return runServer(TEST_DATABASE_URL);
    });
  
    beforeEach(function() {
      return seedBlogPostData();
    });
  
    afterEach(function() {
      return tearDownDb();
    });
  
    after(function() {
      return closeServer();
    });

 describe('GET endpoint', function() {
        
    it('should return all existing blog posts', function() {

        let res;
        return chai.request(app)
             .get('/posts')
            .then(function(_res) {
          
                res = _res;
                res.should.have.status(200);
     
                res.body.should.have.length.of.at.least(1);
                return BlogPost.count();
                })
                .then(function(count) {
                  res.body.should.have.length.of(count);
                });
        }); //is it okay to add blogposts within the then?
  

    it('should return blog posts with right fields', function() {

      let resBlogPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.blogposts.should.be.a('array');
          res.body.blogposts.should.have.length.of.at.least(1);

          res.body.blogposts.forEach(function(blogpost) {
            blogpost.should.be.a('object');
            blogpost.should.include.keys(
              'id', 'title', 'content', 'author', 'publishDate');
          });
          resBlogPost = res.body[0];  //in solution why no blogposts?
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(blogpost) {

        resBlogPost.id.should.equal(blogpost.id);
        resBlogPost.titleshould.equal(blogpost.title);
        resBlogPost.content.should.equal(blogpost.content);
        resBlogPost.author.should.equal(blogpost.author);
        resBlogPost.publishDate.should.equal(blogpost.publishDate);
      });
  });
});



describe('POST endpoint', function() {

  it('should add a new blog post', function() {

    const newBlogPost = generateBlogPosttData();

    return chai.request(app)
      .post('/posts')
      .send(newBlogPost)
      .then(function(res) {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.include.keys(
          'id', 'title', 'content', 'author', 'publishDate');
        res.body.title.should.equal(newBlogPost.title);
        // cause Mongo should have created id on insertion
        res.body.id.should.not.be.null;
        res.body.content.should.equal(newBlogPost.content);
        res.body.author.should.equal(newBlogPost.author);

        return BlogPost.findById(res.body.id);
      })
      .then(function(blogpost) {
        blogpost.id.should.equal(blogpost.id);
        blogpost.titleshould.equal(blogpost.title);
        blogpost.content.should.equal(blogpost.content);
        blogpost.author.should.equal(blogpost.author);
      });
  });
});


describe('PUT endpoint', function() {

      it('should update fields you send over', function() {
        const updateData = {
          title: 'Hello World',
          content: 'Hi there people'
        };
  
        return BlogPost
          .findOne()
          .then(function(blogpost) {
            updateData.id = blogpost.id;
  
            // make request then inspect it to make sure it reflects
            // data we sent
            return chai.request(app)
              .put(`/posts/${blogpost.id}`)
              .send(updateData);
          })
          .then(function(res) {
            res.should.have.status(204);
  
            return BlogPost.findById(updateData.id);
          })
          .then(function(blogpost) {
            blogpost.title.should.equal(updateData.title);
            blogpost.content.should.equal(updateData.content);
          });
        });
    });


    describe('DELETE endpoint', function() {
  
      it('delete a blog post by id', function() {
  
        let blogpost;
  
        return BlogPost
          .findOne()
          .then(function(_blogpost) {
            blogpost = _blogpost;
            return chai.request(app).delete(`/blogposts/${blogpost.id}`);
          })
          .then(function(res) {
            res.should.have.status(204);
            return BlogPost.findById(blogpost.id);
          })
          .then(function(_blogpost) {
            should.not.exist(_blogpost);
          });
      });
    });
  });    