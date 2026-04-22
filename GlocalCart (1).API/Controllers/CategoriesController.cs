using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IProductService _productService;

        public CategoriesController(IProductService productService) { _productService = productService; }

        /// <summary>
        /// Lấy danh sách danh mục phân cấp (Public)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCategories() => Ok(await _productService.GetCategoriesAsync());
    }
}
