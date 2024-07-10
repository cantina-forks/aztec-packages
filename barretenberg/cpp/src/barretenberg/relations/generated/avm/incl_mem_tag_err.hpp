#pragma once

#include "barretenberg/relations/generic_lookup/generic_lookup_relation.hpp"

#include <cstddef>
#include <tuple>

namespace bb {

class incl_mem_tag_err_lookup_settings {
  public:
    static constexpr size_t READ_TERMS = 1;
    static constexpr size_t WRITE_TERMS = 1;
    static constexpr size_t READ_TERM_TYPES[READ_TERMS] = { 0 };
    static constexpr size_t WRITE_TERM_TYPES[WRITE_TERMS] = { 0 };
    static constexpr size_t LOOKUP_TUPLE_SIZE = 1;
    static constexpr size_t INVERSE_EXISTS_POLYNOMIAL_DEGREE = 4;
    static constexpr size_t READ_TERM_DEGREE = 0;
    static constexpr size_t WRITE_TERM_DEGREE = 0;

    template <typename Polynomials>
    static inline auto inverse_polynomial_is_computed_at_row(const Polynomials& in, size_t row)
    {
        return (in.main_tag_err[row] == 1 || in.mem_tag_err[row] == 1);
    }

    template <typename Accumulator, typename AllEntities>
    static inline auto compute_inverse_exists(const AllEntities& in)
    {
        using View = typename Accumulator::View;
        const auto is_operation = View(in.main_tag_err);
        const auto is_table_entry = View(in.mem_tag_err);
        return (is_operation + is_table_entry - is_operation * is_table_entry);
    }

    template <typename AllEntities> static inline auto get_const_entities(const AllEntities& in)
    {
        return std::forward_as_tuple(
            in.incl_mem_tag_err, in.incl_mem_tag_err_counts, in.main_tag_err, in.mem_tag_err, in.main_clk, in.mem_clk);
    }

    template <typename AllEntities> static inline auto get_nonconst_entities(AllEntities& in)
    {
        return std::forward_as_tuple(
            in.incl_mem_tag_err, in.incl_mem_tag_err_counts, in.main_tag_err, in.mem_tag_err, in.main_clk, in.mem_clk);
    }
};

template <typename FF_>
class incl_mem_tag_err_relation : public GenericLookupRelation<incl_mem_tag_err_lookup_settings, FF_> {
  public:
    static constexpr const char* NAME = "incl_mem_tag_err";
};
template <typename FF_> using incl_mem_tag_err = GenericLookup<incl_mem_tag_err_lookup_settings, FF_>;

} // namespace bb