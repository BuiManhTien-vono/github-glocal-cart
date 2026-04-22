using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Users;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public UsersController(IUserService userService) { _userService = userService; }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile() => Ok(await _userService.GetProfileAsync(UserId));

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto) =>
            Ok(await _userService.UpdateProfileAsync(UserId, dto));

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            await _userService.ChangePasswordAsync(UserId, dto);
            return Ok(new { success = true, message = "Đổi mật khẩu thành công." });
        }

        [HttpPost("activate-seller")]
        public async Task<IActionResult> ActivateSeller()
        {
            await _userService.ActivateSellerAsync(UserId);
            return Ok(new { success = true, message = "Kích hoạt Seller thành công." });
        }

        // === ADDRESSES ===
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses() => Ok(await _userService.GetAddressesAsync(UserId));

        [HttpPost("addresses")]
        public async Task<IActionResult> CreateAddress([FromBody] CreateAddressDto dto) =>
            Ok(await _userService.CreateAddressAsync(UserId, dto));

        [HttpPut("addresses/{id}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] CreateAddressDto dto) =>
            Ok(await _userService.UpdateAddressAsync(UserId, id, dto));

        [HttpDelete("addresses/{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            await _userService.DeleteAddressAsync(UserId, id);
            return Ok(new { success = true, message = "Xóa địa chỉ thành công." });
        }

        // === PAYMENT METHODS ===
        [HttpGet("payment-methods")]
        public async Task<IActionResult> GetPaymentMethods() => Ok(await _userService.GetPaymentMethodsAsync(UserId));

        [HttpPost("credit-cards")]
        public async Task<IActionResult> AddCreditCard([FromBody] CreateCreditCardDto dto) =>
            Ok(await _userService.AddCreditCardAsync(UserId, dto));

        [HttpPost("bank-accounts")]
        public async Task<IActionResult> AddBankAccount([FromBody] CreateBankAccountDto dto) =>
            Ok(await _userService.AddBankAccountAsync(UserId, dto));
    }
}
