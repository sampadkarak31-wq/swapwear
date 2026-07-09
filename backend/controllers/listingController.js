const Listing = require('../models/Listing');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all listings with search/filter/sort/pagination
// @route   GET /api/listings
const getListings = async (req, res, next) => {
  try {
    const {
      search,
      category,
      gender,
      condition,
      brand,
      location,
      minValue,
      maxValue,
      sort,
      page = 1,
      limit = 12,
      owner,
    } = req.query;

    const query = { status: 'available' };

    if (owner) query.owner = owner;
    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (condition) query.condition = condition;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (minValue || maxValue) {
      query.estimatedValue = {};
      if (minValue) query.estimatedValue.$gte = Number(minValue);
      if (maxValue) query.estimatedValue.$lte = Number(maxValue);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      value_high: { estimatedValue: -1 },
      value_low: { estimatedValue: 1 },
      popular: { views: -1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('owner', 'name avatar ratingAverage ratingCount location')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: listings.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      listings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single listing by id (with related items)
// @route   GET /api/listings/:id
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'owner',
      'name avatar bio ratingAverage ratingCount completedSwaps location createdAt'
    );

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    listing.views += 1;
    await listing.save();

    const related = await Listing.find({
      _id: { $ne: listing._id },
      category: listing.category,
      status: 'available',
    })
      .limit(4)
      .populate('owner', 'name avatar');

    res.json({ success: true, listing, related });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a listing
// @route   POST /api/listings
const createListing = async (req, res, next) => {
  try {
    const { title, description, category, gender, brand, size, condition, tags, location, estimatedValue } =
      req.body;

    if (!title || !description || !category || !gender || !size || !condition || !location || !estimatedValue) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const images = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    if (images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const listing = await Listing.create({
      owner: req.user._id,
      title,
      description,
      images,
      category,
      gender,
      brand,
      size,
      condition,
      tags: tags ? String(tags).split(',').map((t) => t.trim()).filter(Boolean) : [],
      location,
      estimatedValue: Number(estimatedValue),
    });

    res.status(201).json({ success: true, message: 'Listing created successfully', listing });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    const fields = [
      'title',
      'description',
      'category',
      'gender',
      'brand',
      'size',
      'condition',
      'location',
      'estimatedValue',
      'status',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) listing[field] = req.body[field];
    });
    if (req.body.tags) {
      listing.tags = String(req.body.tags).split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({ url: file.path, publicId: file.filename }));
      listing.images.push(...newImages);
    }

    await listing.save();
    res.json({ success: true, message: 'Listing updated successfully', listing });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await Promise.all(
      listing.images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => null))
    );
    await listing.deleteOne();

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getListings, getListingById, createListing, updateListing, deleteListing };
