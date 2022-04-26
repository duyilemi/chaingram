const Chaingram = artifacts.require("./Chaingram.sol");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Chaingram", ([deployer, author, tipper]) => {
  let chaingram;

  before(async () => {
    chaingram = await Chaingram.deployed();
  });

  describe("deployment", async () => {
    it("deploys successfully", async () => {
      const address = await chaingram.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("has a name", async () => {
      const name = await chaingram.name();
      assert.equal(name, "Chaingram");
    });
  });

  describe("images", async () => {
    let result, imageCount;
    const imgHash = "etqwtrtqyyv457318";

    before(async () => {
      result = await chaingram.uploadImage(imgHash, "Image description", {
        from: author,
      });
      imageCount = await chaingram.imageCount();
    });

    it("creates images", async () => {
      assert.equal(imageCount, 1);
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), imageCount.toNumber(), "id is correct");
      assert.equal(event.imgHash, imgHash, "Hash is correct");
      assert.equal(
        event.description,
        "Image description",
        "description is correct"
      );
      assert.equal(event.tipAmount, "0", "tip amount is correct");
      assert.equal(event.author, author, "author is correct");

      // Image must have imgHash
      await chaingram.uploadImage("", "Image Description", { from: author })
        .should.be.rejected;
      // Image must have description
      await chaingram.uploadImage("Image Hash", "", {
        from: author,
      }).should.be.rejected;
    });
    // check from images struct
    it("lists images", async () => {
      const image = await chaingram.images(imageCount);
      assert.equal(image.id.toNumber(), imageCount.toNumber(), "id is correct");
      assert.equal(image.imgHash, imgHash, "Hash is correct");
      assert.equal(
        image.description,
        "Image description",
        "description is correct"
      );
      assert.equal(image.tipAmount, "0", "tip amount is correct");
      assert.equal(image.author, author, "author is correct");
    });

    it("allows users to tip images", async () => {
      // Track the author balance before purchase
      let oldAuthorBalance;
      oldAuthorBalance = await web3.eth.getBalance(author);
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance);

      result = await chaingram.tipImageOwner(imageCount, {
        from: tipper,
        value: web3.utils.toWei("1", "Ether"),
      });

      // SUCCESS
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), imageCount.toNumber(), "id is correct");
      assert.equal(event.imgHash, imgHash, "Hash is correct");
      assert.equal(
        event.description,
        "Image description",
        "description is correct"
      );
      assert.equal(
        event.tipAmount,
        "1000000000000000000",
        "tip amount is correct"
      );
      assert.equal(event.author, author, "author is correct");

      // Check that author received funds
      let newAuthorBalance;
      newAuthorBalance = await web3.eth.getBalance(author);
      newAuthorBalance = new web3.utils.BN(newAuthorBalance);

      let tipImageOwner;
      tipImageOwner = web3.utils.toWei("1", "Ether");
      tipImageOwner = new web3.utils.BN(tipImageOwner);

      const expectedBalance = oldAuthorBalance.add(tipImageOwner);

      assert.equal(newAuthorBalance.toString(), expectedBalance.toString());

      // FAILURE: Tries to tip a image that does not exist
      await chaingram.tipImageOwner(99, {
        from: tipper,
        value: web3.utils.toWei("1", "Ether"),
      }).should.be.rejected;
    });
  });
});
