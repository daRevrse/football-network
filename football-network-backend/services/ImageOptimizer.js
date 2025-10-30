const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

class ImageOptimizer {
  constructor() {
    this.outputDir = path.join(__dirname, "../uploads/optimized");
    this.presets = {
      logo: {
        small: { width: 100, height: 100 },
        medium: { width: 200, height: 200 },
        large: { width: 400, height: 400 },
      },
      banner: {
        small: { width: 640, height: 200 },
        medium: { width: 1280, height: 400 },
        large: { width: 1920, height: 600 },
      },
      gallery: {
        thumbnail: { width: 300, height: 300 },
        medium: { width: 800, height: 800 },
        large: { width: 1600, height: 1600 },
      },
    };
  }

  async ensureDirectoryExists(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async optimizeImage(inputPath, options = {}) {
    const {
      width,
      height,
      quality = 85,
      format = "jpeg",
      fit = "cover",
      position = "center",
    } = options;

    try {
      let pipeline = sharp(inputPath);

      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit,
          position,
          withoutEnlargement: true,
        });
      }

      pipeline = pipeline[format]({
        quality,
        progressive: true,
        mozjpeg: true,
      });

      const buffer = await pipeline.toBuffer();
      const metadata = await sharp(buffer).metadata();

      return {
        buffer,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length,
        },
      };
    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  async generateVariants(inputPath, type = "logo", customSizes = null) {
    await this.ensureDirectoryExists(this.outputDir);

    const sizes = customSizes || this.presets[type];
    if (!sizes) {
      throw new Error(`Unknown preset type: ${type}`);
    }

    const variants = {};
    const filename = path.basename(inputPath, path.extname(inputPath));

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      try {
        const outputFilename = `${filename}_${sizeName}.jpg`;
        const outputPath = path.join(this.outputDir, outputFilename);

        const optimized = await this.optimizeImage(inputPath, {
          ...dimensions,
          format: "jpeg",
          quality: sizeName === "large" ? 90 : 85,
        });

        await fs.writeFile(outputPath, optimized.buffer);

        variants[sizeName] = {
          path: `/uploads/optimized/${outputFilename}`,
          width: optimized.metadata.width,
          height: optimized.metadata.height,
          size: optimized.metadata.size,
        };
      } catch (error) {
        console.error(`Failed to generate ${sizeName} variant:`, error);
      }
    }

    return variants;
  }

  async cropImage(inputPath, cropData) {
    const { x = 0, y = 0, width, height, targetWidth, targetHeight } = cropData;

    try {
      const buffer = await sharp(inputPath)
        .extract({
          left: Math.round(x),
          top: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        })
        .resize(targetWidth, targetHeight, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      return buffer;
    } catch (error) {
      throw new Error(`Image crop failed: ${error.message}`);
    }
  }

  async optimizeLogo(inputPath, cropData = null) {
    let processedPath = inputPath;

    if (cropData) {
      const croppedBuffer = await this.cropImage(inputPath, {
        ...cropData,
        targetWidth: 400,
        targetHeight: 400,
      });

      const tempPath = path.join(this.outputDir, `temp_${Date.now()}.jpg`);
      await this.ensureDirectoryExists(this.outputDir);
      await fs.writeFile(tempPath, croppedBuffer);
      processedPath = tempPath;
    }

    const variants = await this.generateVariants(processedPath, "logo");

    if (cropData) {
      await fs.unlink(processedPath).catch(() => {});
    }

    return variants;
  }

  async optimizeBanner(inputPath, position = "center") {
    const variants = await this.generateVariants(inputPath, "banner");

    for (const [sizeName, variant] of Object.entries(variants)) {
      const variantPath = path.join(__dirname, "../", variant.path);
      const optimized = await this.optimizeImage(variantPath, {
        position,
        fit: "cover",
      });

      await fs.writeFile(variantPath, optimized.buffer);
    }

    return variants;
  }

  async optimizeGalleryImage(inputPath) {
    return await this.generateVariants(inputPath, "gallery");
  }

  async deleteVariants(variantsData) {
    if (!variantsData || typeof variantsData !== "object") {
      return;
    }

    for (const variant of Object.values(variantsData)) {
      if (variant.path) {
        const fullPath = path.join(__dirname, "../", variant.path);
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          console.error(`Failed to delete variant: ${fullPath}`, error);
        }
      }
    }
  }

  async getImageMetadata(inputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
      };
    } catch (error) {
      throw new Error(`Failed to read image metadata: ${error.message}`);
    }
  }

  calculateOptimizationScore(originalSize, optimizedSizes) {
    const totalOptimizedSize = Object.values(optimizedSizes).reduce(
      (sum, variant) => sum + variant.size,
      0
    );

    const compressionRatio =
      (1 -
        totalOptimizedSize /
          (originalSize * Object.keys(optimizedSizes).length)) *
      100;

    return Math.max(0, Math.min(100, Math.round(compressionRatio)));
  }
}

module.exports = new ImageOptimizer();
