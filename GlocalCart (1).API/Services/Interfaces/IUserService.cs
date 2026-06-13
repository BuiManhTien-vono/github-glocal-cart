using GlocalCart.API.DTOs.Auth;
using GlocalCart.API.DTOs.Users;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<UserInfoDto> GetProfileAsync(int userId);
        Task<UserInfoDto> UpdateProfileAsync(int userId, UpdateProfileDto dto);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto);
        Task<bool> ActivateSellerAsync(int userId);
        Task<bool> DeactivateSellerAsync(int userId);

        // Addresses
        Task<List<AddressDto>> GetAddressesAsync(int userId);
        Task<AddressDto> CreateAddressAsync(int userId, CreateAddressDto dto);
        Task<AddressDto> UpdateAddressAsync(int userId, int addressId, CreateAddressDto dto);
        Task<bool> DeleteAddressAsync(int userId, int addressId);

        // Payment Methods
        Task<PaymentMethodResponseDto> GetPaymentMethodsAsync(int userId);
        Task<CreditCardResponseDto> AddCreditCardAsync(int userId, CreateCreditCardDto dto);
        Task<BankAccountResponseDto> AddBankAccountAsync(int userId, CreateBankAccountDto dto);
    }
}
