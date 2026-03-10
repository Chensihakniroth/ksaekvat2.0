import { ImageGenerationService } from '../src/services/ImageGenerationService';

describe('ImageGenerationService - Native Generators', () => {
  describe('createGridBgRaw', () => {
    it('should generate a valid raw RGBA buffer of expected size', () => {
      const width = 100;
      const height = 100;
      const buffer = ImageGenerationService.createGridBgRaw(width, height);
      
      // Expected length: width * height * 4 channels (RGBA)
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(width * height * 4);
    });
  });

  describe('createCardMaskRaw', () => {
    it('should generate a valid raw RGBA mask buffer', () => {
      const width = 280;
      const height = 420;
      const radius = 24;
      const buffer = ImageGenerationService.createCardMaskRaw(width, height, radius);
      
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(width * height * 4);
      
      // Top-left pixel (0,0) should be transparent (alpha = 0) due to radius
      const alphaAt00 = buffer[3];
      expect(alphaAt00).toBe(0);
      
      // Center pixel should be fully opaque (alpha = 255)
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const idxCenter = (centerY * width + centerX) * 4;
      const alphaAtCenter = buffer[idxCenter + 3];
      expect(alphaAtCenter).toBe(255);
    });
  });

  describe('createEmptySlotRaw', () => {
    it('should generate a valid raw empty slot buffer', () => {
      const width = 280;
      const height = 420;
      const buffer = ImageGenerationService.createEmptySlotRaw(width, height);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(width * height * 4);
    });
  });

  describe('isValidImageBuffer', () => {
    it('should detect valid PNG buffers', () => {
      const mockPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);
      expect(ImageGenerationService.isValidImageBuffer(mockPng)).toBe(true);
    });

    it('should detect invalid buffers', () => {
      const mockHtml = Buffer.from("<html><body>Error</body></html>");
      expect(ImageGenerationService.isValidImageBuffer(mockHtml)).toBe(false);
    });
  });
});
